const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize connection

const MobileEnrichment = sequelize.define("MobileEnrichment", {
  full_name: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
  lead_location: {
    type: DataTypes.ARRAY(DataTypes.STRING), // PostgreSQL supports arrays
    defaultValue: [],
  },
  mobile_1: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
    unique: true,
  },
  mobile_2: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  mobile_1_status: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
  mobile_2_status: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
  mobile_1_country: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
  mobile_2_country: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
  linkedin_url: {
    type: DataTypes.STRING,
    allowNull: true,
    trim: true,
  },
}, {
  timestamps: true, // Automatically add createdAt & updatedAt
});

module.exports = MobileEnrichment;
