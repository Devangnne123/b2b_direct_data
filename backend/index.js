const express = require('express')
const app = express()
// const mongoose = require('mongoose')
const sequelize = require("./config/db"); // Import PostgreSQL connection
const path = require('path');
const cors = require('cors');
require('dotenv').config();  // Load the .env file

const allowedOrigins = [
    'http://localhost:5173', // Client port (Adjust as per your Vite client port)
    // 'http://localhost:5174'  // Admin port (Adjust as per your Vite admin port)
  ];
  
  app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow the Authorization header
  }));

app.use(express.json()); // middleware
app.use(express.urlencoded({ extended: false })); // middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


sequelize.sync() // Sync all models with PostgreSQL
  .then(() => {
    console.log("Database connected & synced successfully.");
    // app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });
// mongoose
//   .connect("mongodb://127.0.0.1:27017/Linkedin_Details")
//   .then((sucess) => {
//     console.log("Database is connected");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.listen(3000, (err, success) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Server is running on port=>" + 3000);
  }
});

const mobileEnrichmentRoutes = require('./routes/mobileEnrichmentRoutes')
app.use('/mobileEnrichments', mobileEnrichmentRoutes)

const userRoutes = require('./routes/userRoutes')
app.use('/users', userRoutes)

const bulkUploadRoutes = require('./routes/bulkUploadRoutes')
app.use('/bulkUpload', bulkUploadRoutes)

const creditTransactionRoutes = require("./routes/creditTransactionRoutes");  // Import new routes
app.use("/transactions", creditTransactionRoutes);  

const excelRoutes = require('./routes/excelRoutes')
app.use('/excel', excelRoutes);

const superAdminRoutes = require('./routes/superAdminRoutes')
app.use('/super-admin', superAdminRoutes);