const path = require("path");
const multer = require("multer");
const Excel = require("../model/excelModel");

// Multer setup to store files in 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Controller function to handle file upload
const saveFile = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const filePath = req.file.path; // File saved in 'uploads' folder

    const newFile = await Excel.create({
      userEmail,
      fileName: req.file.originalname,
      filePath,
      uploadedAt: new Date(),
    });

    res.status(200).json({ message: "File saved successfully", data: newFile });
  } catch (error) {
    console.error("Error saving file:", error);
    res.status(500).json({ message: "Error saving file", error: error.message });
  }
};

// Controller function to fetch user file history
const getHistory = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const files = await Excel.findAll({
      where: { userEmail },
      order: [["uploadedAt", "DESC"]],
      limit: 5,
    });

    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Error fetching file history", error: error.message });
  }
};

module.exports = {
  upload, // Export multer middleware
  saveFile,
  getHistory,
};
