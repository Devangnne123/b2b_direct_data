const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


const VerificationTemp = sequelize.define('verification_temp', {
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clean_linkedin_link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
   remark: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: 'verification_temps',
  timestamps: false
});

module.exports = VerificationTemp;
