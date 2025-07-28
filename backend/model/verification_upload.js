const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs

const VerificationUpload = sequelize.define('verification_upload', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => uuidv4() // Generate a random UUID as default
  },
   date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  email: {
    type: DataTypes.TEXT,
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
  pendingCount: {  // New field to track pending links
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clean_link: {
    type: DataTypes.TEXT
  },
  link_id: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: () => uuidv4(), // Generates a UUID like "550e8400-e29b-41d4-a716-446655440000"
    unique: true // Ensures uniqueness (optional)
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: false
  },
    final_status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending'
  },
  remainingCredits: {
    type: DataTypes.INTEGER, // <-- Add this field
    defaultValue: 0,
  },
  fileName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  creditsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Pending',
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
  
  full_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  head_title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  head_location: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  title_1: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_1: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_link_1: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exp_duration: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exp_location: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  job_type: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  title_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_link_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exp_duration_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  exp_location_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  job_type_2: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  final_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  list_contacts_id: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url_id: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'web_contact_verfication_main',
  timestamps: false
});

module.exports = VerificationUpload;