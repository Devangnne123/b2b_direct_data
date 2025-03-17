const User = require("../model/userModel");
const CreditTransaction = require("../model/creditTransactionModel");

// Function to update user credits and log the transaction
const updateCredits = async (req, res) => {
  let { userEmail, senderEmail, transactionType, amount } = req.body;

  // Ensure all required fields are present
  if (!userEmail || !senderEmail || !transactionType || !amount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Convert transactionType to match ENUM values in PostgreSQL
  transactionType = transactionType.toLowerCase() === "credit" ? "Credit" : "Debit";

  try {
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate new credits
    const newCredits = transactionType === "Credit"
      ? user.credits + amount
      : user.credits - amount;

    if (newCredits < 0) {
      return res.status(400).json({ message: "Insufficient credits." });
    }

    await user.update({ credits: newCredits });

    // Log transaction in CreditTransactions table
    await CreditTransaction.create({
      userEmail,
      senderEmail,
      transactionType, // Now this is "Credit" or "Debit"
      amount,
      remainingCredits: newCredits,
    });

    res.status(200).json({ message: "Credits updated successfully.", newCredits });
  } catch (error) {
    console.error("Error updating credits:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Function to fetch credit transactions for a user
const getCreditTransactions = async (req, res) => {
  try {
    const { userEmail } = req.params;

    // Find transactions where user is either the recipient or sender
    const transactions = await CreditTransaction.findAll({
      where: {
        [Op.or]: [{ userEmail }, { senderEmail: userEmail }],
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
