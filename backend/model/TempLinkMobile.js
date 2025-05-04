// models/TempLinkMobile.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TempLinkMobile = sequelize.define('TempLinkMobile', {
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  matchLinks: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  mobile_numbers: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  person_names: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  person_locations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  mobile_numbers_2: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
}, {
  tableName: 'temp_link_mobile',
  timestamps: false, // Disable timestamps for simplicity
});

module.exports = TempLinkMobile;
