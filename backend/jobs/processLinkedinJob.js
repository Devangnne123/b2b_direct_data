const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const MasterUrl = require("../model/MasterUrl"); // MasterUrl model
const User = require("../model/userModel"); // Adjust path as needed
const emailsent = require("../model/emailsent");
const Link = require("../model/Link");
const nodemailer = require("nodemailer");

async function processLinkedinJob(job) {
  const {
    email,
    filePath,
    originalFileName,
    processCredits
  } = job.data;

  try {
    // Set processing status to true
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
      { userEmail: email, isProcessing: true }
    );

    let uniqueId = uuidv4();
    let links = [];
    const BATCH_SIZE = 200;

    // Process file
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract and filter LinkedIn links
    links = rows
      .flat()
      .filter(
        (cell) =>
          typeof cell === 'string' &&
          cell.toLowerCase().includes('linkedin.com')
      );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      await setProcessingFalse(email);
      throw new Error('No LinkedIn links found.');
    }

    if (links.length > 5000) {
      fs.unlinkSync(filePath);
      await setProcessingFalse(email);
      throw new Error('Max 5000 links allowed');
    }

    let matchCount = 0;

    // First pass: Process all links to categorize them
    for (const link of links) {
      let remark;
      if (
        /linkedin\.com\/in\/ACw|acw|ACo|sales\/lead\/ACw|sales\/people\/ACw|sales\/people\/acw|sales\/people\/AC/i.test(
          link
        )
      ) {
        remark = 'Sales Navigator Link';
      } else if (/linkedin\.com\/company/i.test(link)) {
        remark = 'Company Link';
      } else if (/linkedin\.com\/pub\//i.test(link)) {
        remark = 'Old_link_check';
      } else if (
        !/linkedin\.com\/in\//i.test(link) &&
        !/Linkedin\.Com\/In\//i.test(link) &&
        !/linkedin\.com\/\/in\//i.test(link)
      ) {
        remark = 'Junk Link';
      } else {
        remark = 'ok';
      }

      let cleanedLink;
      let finalstatus;
      if (remark === 'ok') {
        cleanedLink = link
          .replace(/^(https?:\/\/)?(www\.)?/i, '')
          .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
          .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
          .toLowerCase();
      } else {
        finalstatus = 'completed';
      }

      // Create record without matching yet
      await Link.create({
        uniqueId,
        email,
        link,
        totallink: links.length,
        clean_link: cleanedLink,
        remark,
        final_status: finalstatus,
        fileName: originalFileName,
      });
    }

    await emailsent.create({
      uniqueId,
      email,
    });

    // Second pass: Process potential matches in batches
    let offset = 0;
    while (true) {
      const batch = await Link.findAll({
        where: {
          uniqueId,
          email,
        },
        limit: BATCH_SIZE,
        offset: offset,
        order: [['id', 'ASC']],
      });

      if (batch.length === 0) break;

      const cleanLinks = batch
        .map((item) => item.clean_link)
        .filter((link) => link);

      if (cleanLinks.length > 0) {
        const matchedRecords = await MasterUrl.findAll({
          where: {
            clean_linkedin_link: { [Op.in]: cleanLinks },
          },
          attributes: ['linkedin_link_id', 'clean_linkedin_link'],
        });

        const matchMap = new Map();
        matchedRecords.forEach((record) => {
          matchMap.set(record.clean_linkedin_link, record.linkedin_link_id);
        });

        for (const link of batch) {
          if (link.clean_link) {
            const linkedinLinkId = matchMap.get(link.clean_link);
            if (linkedinLinkId) {
              await Link.update(
                {
                  matchLink: link.clean_link,
                  linkedin_link_id: linkedinLinkId,
                  matchCount: ++matchCount,
                },
                { where: { id: link.id } }
              );
            }
          }
        }
      }
      offset += BATCH_SIZE;
    }

    // File cleanup
    fs.unlinkSync(filePath);

    // Process credits if requested
    if (processCredits) {
      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        await Link.destroy({ where: { uniqueId } });
        await setProcessingFalse(email);
        throw new Error('User not found');
      }

      const matchedCount = await Link.count({
        where: {
          uniqueId,
          email: email,
          linkedin_link_id: { [Op.ne]: null },
        },
      });

      await Link.update(
        {
          matchedCount: matchedCount,
        },
        { where: { uniqueId } }
      );

      const creditCost = matchedCount * user.creditCostPerLink;
      if (user.credits < creditCost) {
        await Link.destroy({ where: { uniqueId } });
        await setProcessingFalse(email);
        throw new Error('Insufficient credits');
      }

      user.credits -= creditCost;
      await user.save();

      await Link.update(
        {
          creditDeducted: creditCost,
          remainingCredits: user.credits,
        },
        {
          where: {
            uniqueId
          },
        }
      );

      await Link.update(
        {
          Data_id: 1,
        },
        {
          where: {
            uniqueId,
            linkedin_link_id: { [Op.ne]: null },
          },
        }
      );

      // Send notification email
      try {
         const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "b2bdirectdata@gmail.com", // Your Gmail address
              pass: "npgjrjuebmlmepgy", // Your Gmail password or app password
            },
          });

        const mailOptions = {
          from: 'b2bdirectdata@gmail.com',
          to: email,
          subject: 'Bulk LinkedIn Lookup - Processing',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Processing</h2>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
              <p><strong>File Name:</strong> ${originalFileName}</p>
              <p><strong>Total Links Processed:</strong> ${links.length}</p>
              <p><strong>Total Matches Found:</strong> ${matchedCount}</p>
              <p><strong>Credits Deducted:</strong> ${creditCost}</p>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        `,
        };
        transporter.sendMail(mailOptions).catch(console.error);
      } catch (emailError) {
        console.error('Email failed:', emailError);
      }

      return {
        success: true,
        message: 'Processing completed successfully',
        uniqueId,
        fileName: originalFileName,
        totallink: links.length,
        matchedCount: matchedCount,
        updatedCredits: user.credits,
      };
    }

    return {
      message: 'Upload successful',
      uniqueId,
      fileName: originalFileName,
      totallink: links.length,
      nextStep: processCredits ? undefined : 'process-credits',
    };
  } catch (error) {
    console.error('Job processing error:', error);
    throw error;
  } finally {
    await setProcessingFalse(email);
  }
}

async function setProcessingFalse(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
      { userEmail: email, isProcessing: false }
    );
  } catch (error) {
    console.error('Error setting processing to false:', error);
  }
}

module.exports = {
  processLinkedinJob
};