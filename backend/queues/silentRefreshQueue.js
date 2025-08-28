// const { Queue, Worker } = require('bullmq');
// const IORedis = require('ioredis');
// const { processSilentRefreshJob } = require('../jobs/processSilentRefreshJob');

// // // Redis connection configuration
// // const connection = new IORedis({
// //   host: 'your-ec2-redis-host', // Replace with your EC2 Redis host
// //   port: 6379, // Replace with your Redis port
// //   password: 'your-redis-password', // Replace with your Redis password
// //   maxRetriesPerRequest: null,
// //   enableReadyCheck: false
// // });

// // Create queue
// const silentRefreshQueue = new Queue('silent-refresh-queue', { connection });

// // Create worker
// const worker = new Worker('silent-refresh-queue', async (job) => {
//   if (job.name === 'silent-refresh') {
//     return await processSilentRefreshJob(job);
//   } else {
//     throw new Error(`Unknown job name: ${job.name}`);
//   }
// }, { 
//   connection,
//   concurrency: 1, // Process 1 job concurrently
//   limiter: {
//     max: 5, // Max 5 jobs per period
//     duration: 1000 // 1 second
//   }
// });

// // Event handlers
// worker.on('completed', (job) => {
//   console.log(`Job ${job.id} (${job.name}) completed successfully`);
// });

// worker.on('failed', (job, err) => {
//   console.error(`Job ${job.id} (${job.name}) failed with error:`, err);
// });

// module.exports = { silentRefreshQueue };