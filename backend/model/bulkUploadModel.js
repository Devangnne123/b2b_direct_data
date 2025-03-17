const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize connection

const BulkUpload = sequelize.define("BulkUpload", {
  task: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  linkUpload: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  duplicateCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  netNewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  newEnrichedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  creditUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remainingCredits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true, // Enables createdAt and updatedAt columns
});

module.exports = BulkUpload;
