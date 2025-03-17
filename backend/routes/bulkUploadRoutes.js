// routes/bulkUploadRoutes.js
const express = require('express');
const router = express.Router();
const { addBulkUploadEntry, getBulkUploadStatistics, getUserStatisticsByEmail } = require('../controller/bulkUploadController');

// Add a bulk upload entry
router.post('/add', addBulkUploadEntry);
router.get("/userStatistics", getUserStatisticsByEmail);

// Get bulk upload statistics
router.get('/allstatistics', getBulkUploadStatistics);

module.exports = router;
