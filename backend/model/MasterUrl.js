const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');

const MasterUrl = sequelize.define("masterurl", {
  linkedin_link_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  linkedin_link: {
    type: DataTypes.TEXT,
    allowNull: false,  // Prevent null values
    unique: true,      // Ensures no duplicate links
  },
  clean_linkedin_link: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  linkedin_link_remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: false,  // Disable createdAt, updatedAt fields
});

module.exports = MasterUrl;
