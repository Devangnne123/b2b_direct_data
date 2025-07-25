const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');// Import Sequelize connection

const CreditTransaction = sequelize.define("CreditTransaction",
  {

     uniqueId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
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
  
  tableName: 'web_credt_transaction_report',
  timestamps: true
  }

);

module.exports = CreditTransaction;
