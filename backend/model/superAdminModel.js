const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize connection

const SuperAdminTransaction = sequelize.define("SuperAdminTransaction", {
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recipientEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.STRING,
    defaultValue: "Credit Assigned",
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  remainingCredits: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = SuperAdminTransaction;
