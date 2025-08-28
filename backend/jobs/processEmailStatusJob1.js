
const nodemailer = require('nodemailer');
const emailsent1 = require("../model/emailsent_v");
const VerificationUpload = require("../model/verification_upload");

async function processEmailStatusJob1(job) {
  console.log('⏳ Job: Checking matchLink status for emailsent1...');

  try {
    // Step 1: Get all uniqueIds in emailsent1 with pending status
    const pendingUniqueIds = await emailsent1.findAll({
      where: { status: 'pending' },
      attributes: ['uniqueId'],
      group: ['uniqueId']
    });

    for (const record of pendingUniqueIds) {
      const uniqueId = record.uniqueId;

      // Step 2: Get all VerificationUpload rows for this uniqueId
      const matchedLinks = await VerificationUpload.findAll({
        where: { uniqueId },
        attributes: ['final_status']
      });

      // Step 3: Check if all links are completed
      const hasCompleted = matchedLinks.every(link => link.final_status === 'completed');

      if (hasCompleted) {
        // Step 4: Update emailsent1 status to completed
        
       
        console.log(`✅ ${uniqueId} marked as completed in emailsent1`);

        // Step 5: Get email address for this uniqueId
        const emailRecord = await emailsent1.findOne({
          where: { uniqueId },
          attributes: ['email']
        });

        if (!emailRecord || !emailRecord.email) {
          console.log(`⚠️ No savedEmail found for ${uniqueId}, skipping email sending...`);
          continue;
        }

        const email = emailRecord.email;

        // Step 6: Send the email
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'b2bdirectdata@gmail.com',
              pass: 'npgjrjuebmlmepgy',
            },
          });

          const mailOptions = {
            from: 'b2bdirectdata@gmail.com',
            to: email,
            subject: `B2B LinkedIn Verification System Completed - ${uniqueId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">B2B LinkedIn Verification System Completed</h2>
                <p>All Verification processes for ${uniqueId} have been completed.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">LinkedIn Verification System</h3>
                  <p><strong>File UniqueId:</strong> ${uniqueId}</p>
                </div>
                <p>All results are now available for download.</p>
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          
          await emailsent1.update(
          { status: 'completed' },
          { where: { uniqueId } }
        );
          console.log(`📧 Completion email sent to ${email} for ${uniqueId}`);
        } catch (err) {
          console.error(`❌ Failed to send email for ${uniqueId}:`, err);
        }
      }
    }

    return { success: true, message: 'Email status check completed for emailsent1' };
  } catch (error) {
    console.error('❌ Error in email status check job:', error);
    throw error;
  }
}

module.exports = { processEmailStatusJob1 };