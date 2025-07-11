const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');


  const CompletedReport = sequelize.define('CompletedReport', {


    process: DataTypes.STRING,
    uniqueId: {
    type: DataTypes.STRING,
    allowNull: true, // Make this optional
  },
   totalLinks: {
  type: DataTypes.STRING,
  allowNull: true,
},
matchCount: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
fileName: {
  type: DataTypes.STRING,
  allowNull: true,
},
date: {
  type: DataTypes.DATE,
  allowNull: true,
},
email: {
  type: DataTypes.STRING,
  allowNull: true,
},
createdBy: {
  type: DataTypes.STRING,
  allowNull: true,
},
transactionType: {
  type: DataTypes.STRING,
  allowNull: true,
},
amount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: true,
},
status: {
  type: DataTypes.STRING,
  allowNull: true,
},
type: {
  type: DataTypes.STRING,
  allowNull: true,
}

    // Add any other relevant fields
  }, {
    indexes: [
      {
        unique: true,
        fields: ['uniqueId', 'type']
      }
    ]
  },{
  tableName: 'CompletedReport',
  timestamps: false,
});

module.exports = CompletedReport;
