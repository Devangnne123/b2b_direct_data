const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Link = sequelize.define('Link', {
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totallink: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clean_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  matchLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    linkedin_link_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  matchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile_number_2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  person_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  person_location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  creditDeducted: {
    type: DataTypes.INTEGER,
    allowNull: true, // allowNull true in case it's not deducted immediately
  },
  remainingCredits: {
    type: DataTypes.INTEGER, // <-- Add this field
    defaultValue: 0,
  },
status: {
  type: DataTypes.STRING,
  allowNull: true,        // or true if you want to allow null values
  defaultValue: 'not avalable', // ✅ sets default value to 'pending'
}


}, {
  tableName: 'links',
  timestamps: false,
});

module.exports = Link;
