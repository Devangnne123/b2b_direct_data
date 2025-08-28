
const emailsent = require("../model/emailsent");
const Link = require("../model/Link");
const nodemailer = require('nodemailer');

async function processEmailStatusJob(job) {
  console.log('⏳ Job: Checking matchLink status for emailsent...');

  try {
    // Step 1: Get all uniqueIds in emailsent with pending status
    const pendingUniqueIds = await emailsent.findAll({
      where: { status: 'pending' },
      attributes: ['uniqueId'],
      group: ['uniqueId']
    });

    for (const record of pendingUniqueIds) {
      const uniqueId = record.uniqueId;

      // Step 2: Get all Link rows for this uniqueId
      const matchedLinks = await Link.findAll({
        where: { uniqueId },
        attributes: ['final_status']
      });

      // Step 3: Check if all links are completed
      const hasCompleted = matchedLinks.every(link => link.final_status === 'completed');

      if (hasCompleted) {
        // Step 4: Update emailsent status to completed
        
       
        console.log(`✅ ${uniqueId} marked as completed in emailsent`);

        // Step 5: Get email address for this uniqueId
        const emailRecord = await emailsent.findOne({
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
            subject: `B2B Direct Number Enrichment System Completed - ${uniqueId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">B2B Direct Number Enrichment System Completed</h2>
                <p>All enrichment processes for ${uniqueId} have been completed.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Direct Number Enrichment</h3>
                  <p><strong>File UniqueId:</strong> ${uniqueId}</p>
                </div>
                <p>All results are now available for download.</p>
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          
          await emailsent.update(
          { status: 'completed' },
          { where: { uniqueId } }
        );
          console.log(`📧 Completion email sent to ${email} for ${uniqueId}`);
        } catch (err) {
          console.error(`❌ Failed to send email for ${uniqueId}:`, err);
        }
      }
    }

    return { success: true, message: 'Email status check completed for emailsent' };
  } catch (error) {
    console.error('❌ Error in email status check job:', error);
    throw error;
  }
}

module.exports = { processEmailStatusJob };