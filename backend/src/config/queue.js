const { Queue } = require("bullmq");
const redisClient = require("./redis");

// Create Scraping Queue
const scrapingQueue = new Queue("scraping-jobs", {
  connection: redisClient,
});

scrapingQueue.on("error", (error) => {
  console.error("❌ Queue Error:", error.message);
});

module.exports = { scrapingQueue };
