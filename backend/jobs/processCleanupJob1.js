const { Op } = require('sequelize');
const User = require('../model/userModel'); // Adjust path to models

async function processCleanupJob1(job) {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile1: true,
        processingStartTime1: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000), // older than 10 mins
        },
      },
    });

    for (const user of staleUsers) {
      await user.update({ isProcessingFile1: false, processingStartTime1: null });
    }

    return {
      success: true,
      message: `Cleanup completed for isProcessingFile1. Updated ${staleUsers.length} users.`,
    };
  } catch (error) {
    console.error('Error in cleanup job (isProcessingFile1):', error);
    throw error;
  }
}

module.exports = { processCleanupJob1 };