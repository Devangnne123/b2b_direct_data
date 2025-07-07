const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs

const VerificationTemp_com = sequelize.define('verification_temp_com', {
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clean_linkedin_link: {
    type: DataTypes.STRING,
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
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
 company_headquater: {
    type: DataTypes.STRING,
    allowNull: true
  },
 company_industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employee_count: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year_founded: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_speciality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkedin_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_stock_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verified_page_date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_followers: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location_total: {
    type: DataTypes.STRING,
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visit_website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  final_remaks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_id: {
    type: DataTypes.STRING,
    allowNull: true
  }

}, {
  tableName: 'verification_temps_com',
  timestamps: false, // Enable createdAt and updatedAt
  
});

module.exports = VerificationTemp_com;