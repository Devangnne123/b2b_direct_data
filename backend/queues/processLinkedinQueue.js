const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { processLinkedinJob } = require('../jobs/processLinkedinJob');
const { processVerificationJob } = require('../jobs/processVerificationJob');
const { processVerificationComJob } = require('../jobs/processVerificationComJob');
require("dotenv").config(); // Load the .env file
const connection = new IORedis({
  host: '172.31.23.143', // Replace with your EC2 Redis host
  port: 6379, // Replace with your Redis port
  password: 'redis123', // Replace with your Redis password
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false
// });
// Create queue
const processLinkedinQueue = new Queue('process-linkedin', { connection });

// Create worker
const worker = new Worker('process-linkedin', async (job) => {
  if (job.name === 'process-linkedin') {
    return await processLinkedinJob(job);
  } else if (job.name === 'process-verification') {
    return await processVerificationJob(job);
  } else if (job.name === 'process-verification-com') {
    return await processVerificationComJob(job);
  } else {
    throw new Error(`Unknown job name: ${job.name}`);
  }
}, { 
  connection,
  concurrency: 1, // Process 1 job concurrently
  limiter: {
    max: 5, // Max 5 jobs per period
    duration: 1000 // 1 second
  }
});

// Event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} (${job.name}) completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} (${job.name}) failed with error:`, err);
});

module.exports = { processLinkedinQueue };