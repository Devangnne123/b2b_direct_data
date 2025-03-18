const User = require("../model/userModel");
const CreditTransaction = require("../model/creditTransactionModel");
const { Op } = require('sequelize');

// Function to update user credits and log the transaction
const updateCredits = async (req, res) => {
  let { userEmail, senderEmail, transactionType, amount } = req.body;

  if (!userEmail || !senderEmail || !transactionType || !amount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  transactionType = transactionType.toLowerCase() === "credit" ? "Credit" : "Debit";

  try {
    // Fetch sender (logged-in user) and recipient user
    const sender = await User.findOne({ where: { userEmail: senderEmail } });
    const recipient = await User.findOne({ where: { userEmail } });

    if (!sender || !recipient) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate sender's available credits
    if (transactionType === "Credit" && sender.credits < amount) {
      return res.status(400).json({ message: "Sender does not have enough credits." });
    }

    // Update recipient credits
    const newRecipientCredits = transactionType === "Credit"
      ? recipient.credits + amount
      : recipient.credits - amount;

    if (newRecipientCredits < 0) {
      return res.status(400).json({ message: "User does not have enough credits." });
    }

    await recipient.update({ credits: newRecipientCredits });

    // Update sender's credits
    const newSenderCredits = transactionType === "Credit"
      ? sender.credits - amount // Deduct from sender when adding to user
      : sender.credits + amount; // Add back to sender when deducting from user

    await sender.update({ credits: newSenderCredits });

    // Log transaction
    await CreditTransaction.create({
      userEmail,
      senderEmail,
      transactionType,
      amount,
      remainingCredits: newRecipientCredits,
    });

    await CreditTransaction.create({
      userEmail: senderEmail, // Store the sender's email instead of "SYSTEM"
      senderEmail: userEmail, // Log who received the transaction
      transactionType: transactionType === "Credit" ? "Debit" : "Credit",
      amount,
      remainingCredits: newSenderCredits,
    });

    res.status(200).json({ message: "Credits updated successfully.", newRecipientCredits, newSenderCredits });
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to fetch credit transactions for a user
const getCreditTransactions = async (req, res) => {
  try {
    const { userEmail } = req.params;

    // Find transactions where the logged-in user is the recipient (excluding sender-created duplicate)
    const transactions = await CreditTransaction.findAll({
      where: {
        userEmail, // Only fetch transactions where the logged-in user is the actual recipient/sender
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ data: transactions });
  } catch (error) {
    console.error("Error fetching credit transactions:", error);
    res.status(500).json({ message: "Something went wrong.", error: error.message });
  }
};

module.exports = { updateCredits, getCreditTransactions };
