const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VerificationTemp = sequelize.define('verification_temp', {
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
    allowNull: true
  },

  remark: {
    type: DataTypes.STRING,
    allowNull: false
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
  tableName: 'web_contact_verfication_temp',
  timestamps: false, // Enable createdAt and updatedAt
  
});

module.exports = VerificationTemp;