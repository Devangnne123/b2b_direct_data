const { Sequelize } = require('sequelize');

require('dotenv').config();  // Load the .env file
// Create a new Sequelize instance
const sequelize = new Sequelize('postgres', 'postgres', 'admin==88', {
  host: 'newdevang.cnmam8aewz34.ap-south-1.rds.amazonaws.com',
  dialect: 'postgres',
  port: 5432,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Use true in production with a valid cert
    },
  },
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
