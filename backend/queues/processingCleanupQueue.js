const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { processCleanupJob } = require('../jobs/processCleanupJob');
const { processCleanupJob1 } = require('../jobs/processCleanupJob1');
const { processCleanupJob2 } = require('../jobs/processCleanupJob2');
require("dotenv").config(); // Load the .env file
// const connection = new IORedis({
//   host: '172.31.27.77', // Replace with your EC2 Redis host
//   port: 6379, // Replace with your Redis port
//   password: 'redis123', // Replace with your Redis password
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false
// });


const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  reconnectOnError: (err) => {
    console.error("Redis reconnect error:", err);
    return true; // always reconnect
  },
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000); // exponential backoff
    return delay;
  },
});

// const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false
// });
// Create queue
const processingCleanupQueue = new Queue('processing-cleanup-queue', { connection });

// Create worker
const worker = new Worker('processing-cleanup-queue', async (job) => {
  if (job.name === 'cleanup') {
    return await processCleanupJob(job);
  } else if (job.name === 'cleanup1') {
    return await processCleanupJob1(job);
  } else if (job.name === 'cleanup2') {
    return await processCleanupJob2(job);
  } else {
    throw new Error(`Unknown job name: ${job.name}`);
  }
}, { 
  connection,
  concurrency: 1, // Process 1 job concurrently to ensure sequential execution
  limiter: {
    max: 1, // Max 1 job per period
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

module.exports = { processingCleanupQueue };