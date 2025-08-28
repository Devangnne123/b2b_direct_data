const { emailStatusCheckQueue } = require('../queues/emailStatusCheckQueue');
const cron = require('node-cron');

async function scheduleEmailStatusChecks() {
  console.log('⏰ Email status check jobs scheduled to run every 3 minutes');

  cron.schedule('*/5 * * * *', async () => {
    try {
      // Add jobs to the queue with delays to ensure sequential execution
      await emailStatusCheckQueue.add('email-status-check', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      console.log('📤 Added email-status-check job to queue');

      // Add second job with a delay (e.g., 30 seconds after the first)
      await emailStatusCheckQueue.add('email-status-check1', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        delay: 30000 // 30 seconds delay
      });
      console.log('📤 Added email-status-check1 job to queue');

      // Add third job with a further delay (e.g., 60 seconds after the first)
      await emailStatusCheckQueue.add('email-status-check2', {}, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        delay: 60000 // 60 seconds delay
      });
      console.log('📤 Added email-status-check2 job to queue');
    } catch (error) {
      console.error('❌ Error scheduling email status check jobs:', error);
    }
  });
}

module.exports = { scheduleEmailStatusChecks };