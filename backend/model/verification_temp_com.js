const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const VerificationTemp_com = sequelize.define('verification_temp_com', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clean_linkedin_link: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Pending',
  },
  link_id: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_headquater: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_industry: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_size: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  employee_count: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  year_founded: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_speciality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkedin_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_stock_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified_page_date: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone_number: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_followers: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location_total: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visit_website: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  final_remarks: {  // Corrected spelling here
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_id: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'verification_temps_com',
  timestamps: false
});

module.exports = VerificationTemp_com;