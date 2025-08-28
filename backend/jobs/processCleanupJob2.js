const { Op } = require('sequelize');
const User = require('../model/userModel'); // Adjust path to models

async function processCleanupJob2(job) {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile2: true,
        processingStartTime2: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000), // older than 10 mins
        },
      },
    });

    for (const user of staleUsers) {
      await user.update({ isProcessingFile2: false, processingStartTime2: null });
    }

    return {
      success: true,
      message: `Cleanup completed for isProcessingFile2. Updated ${staleUsers.length} users.`,
    };
  } catch (error) {
    console.error('Error in cleanup job (isProcessingFile2):', error);
    throw error;
  }
}

module.exports = { processCleanupJob2 };