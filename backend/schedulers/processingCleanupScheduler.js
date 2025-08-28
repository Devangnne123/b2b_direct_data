const { processingCleanupQueue } = require('../queues/processingCleanupQueue');
const cron = require('node-cron');

async function scheduleProcessingCleanup() {
  console.log('⏰ Processing cleanup jobs scheduled to run every 10 minutes');

  cron.schedule('*/10 * * * *', async () => {
    try {
      // Add jobs to the queue with delays to ensure sequential execution
      await processingCleanupQueue.add('cleanup', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      console.log('📤 Added cleanup job to queue');

      // Add second job with a delay (e.g., 10 seconds after the first)
      await processingCleanupQueue.add('cleanup1', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        delay: 10000 // 10 seconds delay
      });
      console.log('📤 Added cleanup1 job to queue');

      // Add third job with a further delay (e.g., 20 seconds after the first)
      await processingCleanupQueue.add('cleanup2', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        delay: 20000 // 20 seconds delay
      });
      console.log('📤 Added cleanup2 job to queue');
    } catch (error) {
      console.error('❌ Error scheduling processing cleanup jobs:', error);
    }
  });
}

module.exports = { scheduleProcessingCleanup };