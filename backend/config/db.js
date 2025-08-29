// // const { Sequelize } = require('sequelize');

// // require('dotenv').config();  // Load the .env file
// // // Create a new Sequelize instance
// // const sequelize = new Sequelize('postgres', 'postgres', 'admin==88', {
// //   host: 'newdevang.cnmam8aewz34.ap-south-1.rds.amazonaws.com',
// //   dialect: 'postgres',
// //   port: 5432,
// //   logging: false,
// //   dialectOptions: {
// //     ssl: {
// //       require: true,
// //       rejectUnauthorized: false, // Use true in production with a valid cert
// //     },
// //   },
// //     pool: {
// //     max: 60,           // Increased from default 5
// //     min: 0,
// //     acquire: 80000,     // 30 seconds acquire timeout
// //     idle: 10000,        // 10 seconds idle timeout
// //     evict: 10000        // How often to check for idle connections
// //   },
// //   retry: {
// //     max: 3,             // Retry up to 3 times
// //     match: [
// //       /ConnectionError/,
// //       /ConnectionTimedOutError/,
// //       /TimeoutError/,
// //       /SequelizeConnectionError/,
// //       /SequelizeConnectionRefusedError/,
// //       /SequelizeConnectionAcquireTimeoutError/,
// //        Sequelize.ConnectionError,
// //       Sequelize.ConnectionTimedOutError,
// //       Sequelize.TimeoutError,
// //       /Deadlock/i,
// //       'SQLITE_BUSY'
// //     ]
// //   }
// // });



// // const connectDB = async () => {
// //     try {
// //       await sequelize.authenticate();
// //       console.log('✅ Database connected successfully.');
  
// //       // This creates tables based on your model if they don’t exist
// //       await sequelize.sync(); // or use { alter: true } in dev
  
// //       console.log('✅ All model were synchronized successfully.');
// //     } catch (error) {
// //       console.error('❌ Unable to connect to the database:', error);
// //     }
// //   };
  

// // module.exports = { sequelize, connectDB };
// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// // Create a new Sequelize instance
// const sequelize = new Sequelize('postgres', 'postgres', 'admin==88', {
//   host: 'newdevang.cnmam8aewz34.ap-south-1.rds.amazonaws.com',
//   dialect: 'postgres',
//   port: 5432,
//   logging: false,
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//   },
//   // pool: {
//   //   max: 60,
//   //   min: 10,
//   //   acquire: 80000,
//   //   idle: 10000,
//   //   evict: 10000
//   // },
//   // retry: {
//   //   max: 3,
//   //   match: [
//   //     /ConnectionError/,
//   //     /ConnectionTimedOutError/,
//   //     /TimeoutError/,
//   //     /SequelizeConnectionError/,
//   //     /SequelizeConnectionRefusedError/,
//   //     /SequelizeConnectionAcquireTimeoutError/,
//   //     /Deadlock/i,
//   //     'SQLITE_BUSY'
//   //   ]
//   // }
// });

// const connectDB = async () => {
//   try {
//     console.log('🔄 Attempting to connect to database...');
    
//     // Test the connection
//     await sequelize.authenticate();
//     console.log('✅ Database connected successfully.');

//     // This creates tables based on your model if they don't exist
//     // Use { force: false } in production - never use { force: true } in production
//     await sequelize.sync({ alter: true }); // Use alter: true for development only
    
//     console.log('✅ All models were synchronized successfully.');
//     return true;
//   } catch (error) {
//     console.error('❌ Unable to connect to the database:', error.message);
    
//     // Log additional details for debugging
//     if (error.original) {
//       console.error('❌ Original error:', error.original.message);
//     }
    
//     // Throw the error to prevent the application from starting
//     throw new Error('Database connection failed: ' + error.message);
//   }
// };

// module.exports = { sequelize, connectDB };


const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a new Sequelize instance with optimized connection pooling
const sequelize = new Sequelize('postgres', 'postgres', 'admin==88', {
  host: 'newdevang.cnmam8aewz34.ap-south-1.rds.amazonaws.com',
  dialect: 'postgres',
  port: 5432,
  logging: false, // Set to console.log for debugging if needed
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  // pool: {
  //   max: 5,           // Reduced from 60 to prevent overloading RDS
  //   min: 1,
  //   acquire: 20000,    // 60 seconds acquire timeout
  //   idle: 10000,       // 10 seconds idle timeout
  //   evict: 10000       // How often to check for idle connections
  // },
  // retry: {
  //   max: 2,
  //   match: [
  //     /SequelizeConnectionError/,
  //     /SequelizeConnectionAcquireTimeoutError/,
  //     /TimeoutError/,
  //     /Deadlock/i,
  //   ]
  // }
});

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync models - use caution with alter in production
    await sequelize.sync({ alter: false }); // Changed to false for production safety
    
    console.log('✅ All models were synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    
    // Log additional details for debugging
    if (error.original) {
      console.error('❌ Original error:', error.original.message);
    }
    
    // Throw the error to prevent the application from starting
    throw new Error('Database connection failed: ' + error.message);
  }
};

// Add connection cleanup on application shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Application is shutting down...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    process.exit(1);
  }
});

module.exports = { sequelize, connectDB };