const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Credit = sequelize.define('Credit', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Add this to your User model
credits: {
  type: DataTypes.INTEGER,
  defaultValue: 0
},
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  type: {
    type: DataTypes.STRING, // 'purchase' or 'usage'
    allowNull: false
  }
}, {
  tableName: 'credits',
  timestamps: false
});

module.exports = Credit;