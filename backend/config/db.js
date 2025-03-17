const { Sequelize } = require("sequelize");

// Initialize Sequelize with PostgreSQL connection
const sequelize = new Sequelize("reversecontact", "postgres", "Admin", {
  host: "localhost",
  dialect: "postgres",
  logging: false, // Disable SQL query logging
});

module.exports = sequelize;
