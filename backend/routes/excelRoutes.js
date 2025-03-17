const express = require("express");
const { upload, saveFile, getHistory } = require("../controller/excelController");
const router = express.Router();

// Save file route
router.post("/saveFile", upload.single("file"), saveFile);

// Fetch user file history
router.get("/history/:userEmail", getHistory);

module.exports = router;
