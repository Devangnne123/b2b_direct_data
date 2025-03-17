const BulkUpload = require("../model/bulkUploadModel");
const { Op } = require("sequelize"); // Ensure Op is imported!

// Add Bulk Upload Entry
exports.addBulkUploadEntry = async (req, res) => {
  try {
    const {
      task,
      filename,
      email,
      linkUpload,
      duplicateCount = 0,
      netNewCount = 0,
      newEnrichedCount = 0,
      creditUsed = 0,
      remainingCredits = 0,
    } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const bulkUploadData = await BulkUpload.create({
      task,
      filename,
      email,
      linkUpload,
      duplicateCount,
      netNewCount,
      newEnrichedCount,
      creditUsed,
      remainingCredits,
    });

    res.status(201).json({
      message: "Bulk upload entry saved successfully",
      data: bulkUploadData,
    });
  } catch (error) {
    console.error("Error saving bulk upload entry:", error);
    res.status(500).json({
      message: "Error saving bulk upload entry",
      error: error.message,
    });
  }
};

// Get All Bulk Upload Statistics
exports.getBulkUploadStatistics = async (req, res) => {
  try {
    const statistics = await BulkUpload.findAll();

    if (!statistics || statistics.length === 0) {
      return res.status(404).json({ data: [], message: "No statistics found" });
    }

    res.status(200).json({ data: statistics }); // ✅ Wrapping in { data: [...] }
  } catch (error) {
    console.error("❌ Error fetching bulk upload statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};


// Get User Statistics by Email
exports.getUserStatisticsByEmail = async (req, res) => {
  const { email, fromDate } = req.query; // Extract email & date

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userStatistics = await BulkUpload.findAll({
      where: {
        email,
        createdAt: { [Op.gte]: new Date(fromDate) }, // ✅ Filter by date
      },
    });

    if (!userStatistics || userStatistics.length === 0) {
      return res.status(404).json({ message: "No statistics found" });
    }

    res.status(200).json(userStatistics);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
