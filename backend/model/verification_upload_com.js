const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const VerificationUpload_com = sequelize.define('verification_upload_com', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => uuidv4()
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  totallink: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pendingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clean_link: {
    type: DataTypes.TEXT
  },
  link_id: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: () => uuidv4(),
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  final_status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending'
  },
  remainingCredits: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  fileName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  creditsUsed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Pending',
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
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Data_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
}, {
  tableName: 'verification_uploads_com',
  timestamps: false
});

module.exports = VerificationUpload_com;