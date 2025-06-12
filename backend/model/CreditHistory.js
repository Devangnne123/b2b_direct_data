const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');



  const Credithistory = sequelize.define('CreditHistory', {
    email: DataTypes.STRING,
    creditsUsed: DataTypes.INTEGER,
    operation: DataTypes.STRING,
    uniqueId: DataTypes.STRING
  }
, {
  tableName: 'credithistory',
  timestamps: false
});

module.exports = Credithistory;
