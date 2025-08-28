const { Op } = require('sequelize');
const User = require('../model/userModel'); // Adjust path to models

async function processCleanupJob(job) {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile: true,
        processingStartTime: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000), // older than 10 mins
        },
      },
    });

    for (const user of staleUsers) {
      await user.update({ isProcessingFile: false, processingStartTime: null });
    }

    return {
      success: true,
      message: `Cleanup completed for isProcessingFile. Updated ${staleUsers.length} users.`,
    };
  } catch (error) {
    console.error('Error in cleanup job (isProcessingFile):', error);
    throw error;
  }
}

module.exports = { processCleanupJob };