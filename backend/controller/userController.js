const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require('../routes/mailer');
require("dotenv").config();


// Add User
exports.addUser = async (req, res) => {
  const { userEmail, userPassword, companyName, phoneNumber, roleId } = req.body;

  if (!userEmail || !userPassword || !companyName || !phoneNumber) {
    return res.status(400).json({ message: "All fields are mandatory." });
  }

  try {
    const existingUser = await User.findOne({ where: { userEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const user = await User.create({
      userEmail,
      userPassword: hashedPassword,
      companyName,
      phoneNumber,
      roleId,
    });

    res.status(200).json({ message: "User added successfully.", user });
  } catch (err) {
    console.error("Error while adding user:", err);
    res.status(500).json({ message: "Something went wrong.", error: err.message });
  }
};

// Add New User with Credits
exports.addNewUser = async (req, res) => {
  const { userEmail, userPassword, roleId, createdBy, credits } = req.body;

  if (!userEmail || !userPassword || !createdBy) {
    return res.status(400).json({ message: "All fields are mandatory." });
  }

  try {
    const existingUser = await User.findOne({ where: { userEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const user = await User.create({
      userEmail,
      userPassword: hashedPassword,
      roleId,
      createdBy,
      credits: credits || 0,
    });

    res.status(200).json({ message: "User added successfully.", user });
  } catch (err) {
    console.error("Error while adding user:", err);
    res.status(500).json({ message: "Something went wrong.", error: err.message });
  }
};

exports.getUsersByCreator = async (req, res) => {
  const { userEmail } = req.params; // Get userEmail from request parameters

  if (!userEmail) {
    return res.status(400).json({ message: "User email is required." });
  }

  try {
    const users = await User.findAll({
      where: { createdBy: userEmail }, // Fetch only users created by this email
      attributes: ["id", "userEmail", "roleId", "credits", "createdAt"], // Select only necessary fields
    });

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("Error while fetching users:", err);
    res.status(500).json({ message: "Something went wrong.", error: err.message });
  }
};

exports.getUsersByadmin = async (req, res) => {
  const { userEmail } = req.params; // Get userEmail from request parameters

  if (!userEmail) {
    return res.status(400).json({ message: "User email is required." });
  }

  try {
    const users = await User.findAll({
      where: { roleId: 1 }, // Fetch only users created by this email"
      attributes: ["id", "userEmail", "roleId", "credits","creditCostPerLink","creditCostPerLink_V","creditCostPerLink_C", "createdAt"], // Select only necessary fields
    });

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("Error while fetching users:", err);
    res.status(500).json({ message: "Something went wrong.", error: err.message });
  }
};



// Update Credits
exports.updateCredits = async (req, res) => {
  const { userEmail, credits } = req.body;

  if (!userEmail || credits == null) {
    return res.status(400).json({ message: "Email and credits are required." });
  }

  try {
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.credits = credits;
    await user.save();

    res.status(200).json({ message: "Credits updated successfully.", user });
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ message: "Failed to update credits.", error: error.message });
  }
};

// Get Users
exports.getUser = async (req, res) => {
  try {
    const users = await User.findAll({});

    if (!users.length) {
      return res.status(404).json({ message: "No users found." });
    }

    res.status(200).json({ message: "Users fetched successfully.", users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users.", error: err.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;

    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.userEmail },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.userEmail,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};




  exports.sendOtp = async (req, res) => {
    try {
      const { email } = req.body;

      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
      }

      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        // Don't reveal whether user exists for security
        return res.status(200).json({ message: "If this email exists, we've sent an OTP to it." });
      }

      // Check if user is blocked from OTP requests
      if (user.otpBlockedUntil && user.otpBlockedUntil > new Date()) {
        return res.status(429).json({ 
          message: `Too many attempts. Try again after ${user.otpBlockedUntil.toLocaleTimeString()}`
        });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

      // Update user with OTP and expiry
      await user.update({ 
        resetPasswordOtp: otp,
        resetPasswordOtpExpiry: otpExpiry,
        otpAttempts: 0 // Reset attempts when new OTP is sent
      });

      // Send OTP via email
      const emailSent = await sendOtpEmail(email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
      }

      res.status(200).json({ 
        message: "OTP sent to your email address.",
        // Don't send OTP in response in production
        otp: process.env.NODE_ENV === 'development' ? otp : null 
      });
    } catch (error) {
      console.error("OTP send error:", error);
      res.status(500).json({ 
        message: "An error occurred while processing your request.",
        error: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  },



  // Reset password with OTP
  exports.resetPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const user = await User.findOne({ where: { userEmail: email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if OTP matches and is not expired
    if (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordOtpExpiry) {
      // Increment failed attempts
      const attempts = (user.otpAttempts || 0) + 1;
      let otpBlockedUntil = null;
      
      // Block after 3 failed attempts for 15 minutes
      if (attempts >= 3) {
        otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await user.update({ 
        otpAttempts: attempts,
        otpBlockedUntil
      });
      
      return res.status(400).json({ 
        message: attempts >= 3 
          ? "Too many incorrect attempts. Try again later." 
          : "Invalid or expired OTP." 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear OTP fields
    await user.update({ 
      userPassword: hashedPassword,
      resetPasswordOtp: null,
      resetPasswordOtpExpiry: null,
      otpAttempts: 0,
      otpBlockedUntil: null
    });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};




// Get All Admins
exports.getAllAdmin = async (req, res) => {
  try {
    const users = await User.findAll({ where: { roleId: 1 } });

    if (!users.length) {
      return res.status(404).json({ message: "No admins found." });
    }

    res.status(200).json({ message: "Admins fetched successfully.", users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins.", error: err.message });
  }
};

exports.getUserCredits = async (req, res) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    return res.status(400).json({ message: "User email is required." });
  }

  try {
    const user = await User.findOne({
      where: { userEmail },
      attributes: ["userEmail", "credits"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ success: true, credits: user.credits });
  } catch (err) {
    console.error("Error fetching user credits:", err);
    res.status(500).json({ message: "Something went wrong.", error: err.message });
  }
};




exports.updateCreditCost_V = async (req, res) => {
  try {
    const { userEmail, creditCostPerLink_V } = req.body;
    
    // Validate input
    if (!userEmail || creditCostPerLink_V === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Email and credit cost are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update and save
    user.creditCostPerLink = creditCostPerLink_V;
    await user.save();

    return res.json({
      success: true,
      message: 'Credit cost updated successfully',
      newCost: user.creditCostPerLink
    });

  } catch (error) {
    console.error('Credit cost update error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
  }
};


exports.updateCreditCost = async (req, res) => {
  try {
    const { userEmail, creditCostPerLink } = req.body;
    
    // Validate input
    if (!userEmail || creditCostPerLink === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Email and credit cost are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update and save
    user.creditCostPerLink = creditCostPerLink;
    await user.save();

    return res.json({
      success: true,
      message: 'Credit cost updated successfully',
      newCost: user.creditCostPerLink
    });

  } catch (error) {
    console.error('Credit cost update error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
  }
};



// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.userPassword = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};




const { Op } = require('sequelize');

async function getLinksReport() {
  try {
    const links = await Link.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('COUNT', sequelize.col('link')), 'linkCount'],
        [sequelize.literal('FIRST(totallink)'), 'firstTotalLink'],
        'matchLink',
        'fileName',
        [sequelize.literal('database()'), 'databaseName'],
        'date',
        'email',
        [sequelize.fn('SUM', sequelize.col('creditDeducted')), 'totalCreditDeducted']
      ],
      group: ['uniqueId', 'matchLink', 'fileName', 'date', 'email'],
      order: [['date', 'DESC']]
    });

    return links.map(link => ({
      uniqueId: link.uniqueId,
      linkCount: link.get('linkCount'),
      firstTotalLink: link.get('firstTotalLink'),
      matchLink: link.matchLink,
      fileName: link.fileName,
      databaseName: link.get('databaseName'),
      date: link.date,
      email: link.email,
      totalCreditDeducted: link.get('totalCreditDeducted') || 0
    }));
  } catch (error) {
    console.error('Error fetching links report:', error);
    throw error;
  }
}

// Usage
getLinksReport()
  .then(report => console.log(report))
  .catch(err => console.error(err));