const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


const VerificationUpload = sequelize.define('verification_upload', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  totallink: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  clean_link: {
    type: DataTypes.TEXT
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  matchLink: {
    type: DataTypes.TEXT
  },
  linkedin_link_id: {
    type: DataTypes.INTEGER
  },
  matchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'verification_uploads',
  timestamps: false
});

module.exports = VerificationUpload;
