// models/Payment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: true, // Changed to allow null initially
    unique: true
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    defaultValue: () => `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
   remainingCredits: {
    type: DataTypes.INTEGER, // <-- Add this field
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('CREATED', 'COMPLETED', 'FAILED', 'REFUNDED'),
    allowNull: false,
    defaultValue: 'CREATED'
  },
  payer_id: {
    type: DataTypes.STRING,
    allowNull: true // Changed to allow null initially
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: false,
  hooks: {
    beforeUpdate: (payment) => {
      payment.updated_at = new Date();
    }
  }
});

module.exports = Payment;