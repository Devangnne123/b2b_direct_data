// requestQueue.js - Simple request queuing system
class RequestQueue {
  constructor(maxConcurrent = 1) {
    this.queue = [];
    this.activeRequests = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.activeRequests++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeRequests--;
      this.process();
    }
  }

  getQueueLength() {
    return this.queue.length;
  }

  getActiveRequests() {
    return this.activeRequests;
  }
}

// Create a singleton instance with max 1 concurrent database request
const userRequestQueue = new RequestQueue(1);

module.exports = userRequestQueue;