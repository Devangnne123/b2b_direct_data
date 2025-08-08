const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const emailsent = sequelize.define('emailsent', {
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
   email: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  }


  }, {
  tableName: 'email_sent',
  timestamps: false
});

module.exports = emailsent;