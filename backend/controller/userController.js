const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
      { expiresIn: "1h" }
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
