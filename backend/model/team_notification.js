const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


const TeamEmail = sequelize.define('team_email', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: "Must be a valid email address"
      },
      notEmpty: {
        msg: "Email cannot be empty"
      }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: "Name must be less than 100 characters"
      }
    }
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

}, {
  tableName: 'team_emails',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TeamEmail;