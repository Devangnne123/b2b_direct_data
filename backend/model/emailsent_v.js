const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const emailsent1 = sequelize.define('emailsent1', {
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
   email: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },status: {
    type: DataTypes.STRING,
    allowNull: true,        // or true if you want to allow null values
    defaultValue: 'pending', // ✅ sets default value to 'pending'
  }
  


  }, {
  tableName: 'email_sent_v',
  timestamps: false
});

module.exports = emailsent1;