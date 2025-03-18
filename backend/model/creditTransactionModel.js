const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize connection

const CreditTransaction = sequelize.define(
  "CreditTransaction",
  {
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Users", // Ensure Users table exists
        key: "userEmail",
      },
      onDelete: "CASCADE",
    },
    senderEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM("Credit", "Debit"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), // Precise decimal for currency
      allowNull: false,
    },
    remainingCredits: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true, // createdAt and updatedAt included
  }
);

module.exports = CreditTransaction;
