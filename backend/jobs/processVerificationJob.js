const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const User = require("../model/userModel");
const VerificationUpload = require("../model/verification_upload"); // Adjust path as needed
const emailsent1 = require("../model/emailsent_v");
const nodemailer = require("nodemailer");
const TeamEmail = require("../model/team_notification")

async function processVerificationJob(job) {
  const { email, filePath, originalFileName, processCredits } = job.data;

  try {
    // Set processing status to true
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing1`,
      { userEmail: email, isProcessing: true }
    );

    // Initialize variables
    let uniqueId = uuidv4();
    let links = [];
    const BATCH_SIZE = 600;

    // Process file
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract and filter LinkedIn links
    links = rows
      .flat()
      .filter(
        (cell) =>
          typeof cell === "string" &&
          cell.toLowerCase().includes("linkedin.com")
      );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      await setProcessingFalse2(email);
      throw new Error("No LinkedIn links found.");
    }

    if (links.length > 10000) {
      fs.unlinkSync(filePath);
      await setProcessingFalse2(email);
      throw new Error("Max 10000 links allowed");
    }

    let pendingCount = 0;

    // First pass: Process all links to categorize them
    for (const link of links) {
      let remark;

      if (
        /linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)
      ) {
        remark = "Sales Navigator Link";
      } else if (
        /linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)
      ) {
        remark = "Sales Navigator Link";
      } else if (/linkedin\.com\/company/i.test(link)) {
        remark = "Company Link";
      } else if (/linkedin\.com\/pub\//i.test(link)) {
        remark = "This page doesn't exist";
      } else if (!/linkedin\.com\/in\//i.test(link)) {
        remark = "Junk Link";
      } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
        remark = "Invalid Profile Link";
      } else {
        remark = "pending";
        pendingCount++;
      }

      let finalStatus;
      let cleanedLink =
        remark === "pending"
          ? link
              .trim()
              .replace(/^(https?:\/\/)?(www\.)?/i, "")
              .replace(/linkedin\.com\/+in\/+/i, "linkedin.com/in/")
              .toLowerCase()
              .replace(/\/+$/, "")
              .concat("/details/experience/")
          : null;

      // New logic: Check if cleanedLink is null
      if (cleanedLink === null) {
        finalStatus = "completed";
      }

      // Create record individually
      await VerificationUpload.create({
        uniqueId,
        email,
        link,
        totallink: links.length,
        clean_link: cleanedLink,
        remark,
        final_status: finalStatus,
        fileName: originalFileName,
        pendingCount,
      });
    }

    await emailsent1.create({
      uniqueId,
      email,
    });

    fs.unlinkSync(filePath);

    // Process credits if requested
    if (processCredits) {
      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        await VerificationUpload.destroy({ where: { uniqueId } });
        await setProcessingFalse2(email);
        throw new Error("User not found");
      }

      const creditsToDeduct = pendingCount * user.creditCostPerLink_V;
      if (user.credits < creditsToDeduct) {
        await VerificationUpload.destroy({ where: { uniqueId } });
        await setProcessingFalse2(email);
        throw new Error(
          `Insufficient credits. Required: ${creditsToDeduct}, Available: ${user.credits}`
        );
      }

      // Deduct credits
      user.credits -= creditsToDeduct;
      await user.save();

      // Update records with credit info
      await VerificationUpload.update(
        {
          creditsUsed: creditsToDeduct,
          remainingCredits: user.credits,
        },
        { where: { uniqueId } }
      );

      await VerificationUpload.update(
        {
          Data_id: 1,
        },
        { where: { uniqueId, clean_link: { [Op.ne]: null } } }
      );

         // Send email to all team members
    try {
      // Find all team emails
      const teamEmails = await TeamEmail.findAll({
        attributes: ['email', 'name']
      });

      if (teamEmails.length > 0) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "b2bdirectdata@gmail.com",
            pass: "npgjrjuebmlmepgy",
          },
        });

        // Send email to each team member separately
        for (const teamMember of teamEmails) {
          const mailOptions = {
            from: `"B2B Full Details" <b2bdirectdata@gmail.com>`,
            to: teamMember.email,
            subject: `Please Start Full Details`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Link Uploaded. Please Start Full Details</h2>
                
                <p><strong>Total Links:</strong> $${pendingCount}</p>
                
                <p><strong>Uploaded By:</strong> ${email}</p>
                <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
                
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `,
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`Notification sent to team member: ${teamMember.email}`);
        }
      }
    } catch (emailError) {
      console.error("Team notification email failed:", emailError);
    }

      // Send completion email
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "b2bdirectdata@gmail.com",
            pass: "npgjrjuebmlmepgy",
          },
        });

        const mailOptions = {
          from: "b2bdirectdata@gmail.com",
          to: email,
          subject: "LinkedIn Verification - Processing",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">LinkedIn Verification - Processing</h2>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Processing Details</h3>
                <p><strong>File Name:</strong> ${originalFileName}</p>
                <p><strong>Total Links:</strong> ${links.length}</p>
                <p><strong>Pending Links Processed:</strong> ${pendingCount}</p>
                <p><strong>Credits Deducted:</strong> ${creditsToDeduct}</p>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("Email failed:", emailError);
      }

      return {
        success: true,
        message: "Processing completed successfully",
        uniqueId,
        fileName: originalFileName,
        totalLinks: links.length,
        pendingCount,
        creditsDeducted: creditsToDeduct,
        remainingCredits: user.credits,
        date: new Date().toISOString(),
      };
    }

    return {
      message: "Links processed successfully (credits not deducted)",
      uniqueId,
      fileName: originalFileName,
      totalLinks: links.length,
      pendingCount,
      date: new Date().toISOString(),
      nextStep: "confirm-credits",
    };
  } catch (error) {
    console.error("Job processing error:", error);
    throw error;
  } finally {
    await setProcessingFalse2(email);
  }
}

async function setProcessingFalse2(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing1`,
      { userEmail: email, isProcessing: false }
    );
  } catch (err) {
    console.error("Error setting processing status to false:", err);
  }
}

module.exports = { processVerificationJob };