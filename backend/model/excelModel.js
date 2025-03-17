const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize connection

const Excel = sequelize.define("Excel", {
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, // Disable Sequelize's automatic timestamps
});

module.exports = Excel;
