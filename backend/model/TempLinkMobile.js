// model/TempLinkMobile.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TempLinkMobile = sequelize.define('TempLinkMobile', {
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  matchLink: {
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
}, {
  tableName: 'temp_link_mobile',
  timestamps: false,
});

module.exports = TempLinkMobile;
