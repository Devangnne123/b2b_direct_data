const { Sequelize } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize('newdevang', 'postgres', 'Admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // Set to true if you want to see raw SQL logs
});

const connectDB = async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully.');
  
      // This creates tables based on your model if they don’t exist
      await sequelize.sync(); // or use { alter: true } in dev
  
      console.log('✅ All model were synchronized successfully.');
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error);
    }
  };
  

module.exports = { sequelize, connectDB };
