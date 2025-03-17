const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  userPassword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
  },
  phoneNumber: {
    type: DataTypes.STRING,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.STRING, // Stores the email of the user who added this user
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // Default credits for a new user
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = User;
