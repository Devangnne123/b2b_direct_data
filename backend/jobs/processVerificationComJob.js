const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const User = require("../model/userModel");
const VerificationUpload_com = require("../model/verification_upload_com"); // Adjust path as needed
const emailsent2 = require("../model/emailsent_c");
const nodemailer = require("nodemailer");

async function processVerificationComJob(job) {
  const { email, filePath, originalFileName, processCredits } = job.data;

  try {
    // Set processing status to true
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing2`,
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
      await setProcessingFalse3(email);
      throw new Error("No LinkedIn links found.");
    }

    if (links.length > 10000) {
      fs.unlinkSync(filePath);
      await setProcessingFalse3(email);
      throw new Error("Max 10000 links allowed");
    }

    let pendingCount = 0;

    // First pass: Process all links individually
    for (const link of links) {
      let remark;
      let clean_link;
      let finalStatus;

      if (
        /linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)/i.test(
          link
        )
      ) {
        remark = "pending";
        pendingCount++;
        const companySlug =
          link.match(
            /linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)\/([^/?#]+)/i
          )?.[2] || "unknown-company";
        clean_link = `https://www.linkedin.com/company/${companySlug}/about`;
        finalStatus = "pending";
      } else if (
        /linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link) ||
        /linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)
      ) {
        remark = "Sales Navigator Link";
        finalStatus = "completed";
      } else if (/linkedin\.com\/pub\//i.test(link)) {
        remark = "This page doesn't exist";
        finalStatus = "completed";
      } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
        remark = "Invalid Profile Link";
        finalStatus = "completed";
      } else if (!/linkedin\.com\/in\//i.test(link)) {
        remark = "Junk Link";
        finalStatus = "completed";
      } else {
        remark = "invalid company";
        finalStatus = "completed";
      }

      // Create record individually
      await VerificationUpload_com.create({
        uniqueId,
        email,
        link,
        totallink: links.length,
        clean_link,
        remark,
        final_status: finalStatus,
        fileName: originalFileName,
        pendingCount,
      });
    }

    await emailsent2.create({
      uniqueId,
      email,
    });

    fs.unlinkSync(filePath);

    // Process credits if requested
    if (processCredits) {
      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        await VerificationUpload_com.destroy({ where: { uniqueId } });
        await setProcessingFalse3(email);
        throw new Error("User not found");
      }

      const creditsToDeduct = pendingCount * user.creditCostPerLink_C;
      if (user.credits < creditsToDeduct) {
        await VerificationUpload_com.destroy({ where: { uniqueId } });
        await setProcessingFalse3(email);
        throw new Error(
          `Insufficient credits. Required: ${creditsToDeduct}, Available: ${user.credits}`
        );
      }

      // Deduct credits
      user.credits -= creditsToDeduct;
      await user.save();

      // Update records with credit info
      await VerificationUpload_com.update(
        {
          creditsUsed: creditsToDeduct,
          remainingCredits: user.credits,
        },
        { where: { uniqueId } }
      );

      await VerificationUpload_com.update(
        {
          Data_id: 1,
        },
        { where: { uniqueId, clean_link: { [Op.ne]: null } } }
      );

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
          subject: "Company Verification - Processing",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Company Verification - Processing</h2>
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
    await setProcessingFalse3(email);
  }
}

async function setProcessingFalse3(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing2`,
      { userEmail: email, isProcessing: false }
    );
  } catch (err) {
    console.error("Error setting processing status to false:", err);
  }
}

module.exports = { processVerificationComJob };