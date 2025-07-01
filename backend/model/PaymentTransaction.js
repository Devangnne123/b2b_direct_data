const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    }
  }, {
    
  tableName: 'payments_T',
  timestamps: false,
  });

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

module.exports = PaymentTransaction;
