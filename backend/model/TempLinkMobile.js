// model/TempLinkMobile.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TempLinkMobile = sequelize.define('TempLinkMobile', {
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  linkedin_link_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

  matchLink: {
    type: DataTypes.TEXT,
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
    type: DataTypes.TEXT,
    allowNull: true,
  },
  person_location: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'web_direct_number_temp',
  timestamps: false,
});

module.exports = TempLinkMobile;
