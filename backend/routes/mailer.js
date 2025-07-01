const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: "b2bdirectdata@gmail.com",
    pass: "npgjrjuebmlmepgy"
  },
});

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: "b2bdirectdata@gmail.com",
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for ${process.env.APP_NAME || 'Your App'}. Please use the following OTP to proceed:</p>
            
            <div style="background: #ffffff; border: 1px solid #ddd; padding: 15px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2c3e50;">
              ${otp}
            </div>
            
            <p>This OTP is valid for 15 minutes. If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            
            <p>Best regards,<br/>
            The ${process.env.APP_NAME || 'Your App'} Team</p>
            
            <div style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
              <p>If you're having trouble, copy and paste the OTP into the application.</p>
              <p>Need help? Contact our support team at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@yourapp.com'}">${process.env.SUPPORT_EMAIL || 'support@yourapp.com'}</a></p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Add this to your mailer.js file
const sendCompletionEmail = async (email, verificationData) => {
  try {
    const mailOptions = {
      from: "b2bdirectdata@gmail.com" ,
      to: email,
      subject: `Verification Completed: ${verificationData.uniqueId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Verification Process Completed</h2>
            <p>Hello,</p>
            <p>Your verification process for batch <strong>${verificationData.uniqueId}</strong> has been completed.</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e9; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #2e7d32;">Verification Summary</h3>
              <p><strong>File Name:</strong> ${verificationData.fileName || 'Unknown'}</p>
              <p><strong>Total Links:</strong> ${verificationData.totalLinks || 0}</p>
              <p><strong>Completed At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Credits Used:</strong> ${verificationData.creditsUsed || 0}</p>
            </div>
            
            <p>You can download the complete results from your verification history.</p>
            
            <p>Best regards,<br/>
            The ${process.env.APP_NAME || 'Your App'} Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending completion email:', error);
    return false;
  }
};

// Update your exports
module.exports = { sendOtpEmail, sendCompletionEmail };