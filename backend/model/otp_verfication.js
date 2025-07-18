
const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');// Import Sequelize connection



const OtpVerification = sequelize.define('otp_verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'web_otp_verifications',
  timestamps: true,
});

module.exports = OtpVerification;
