import cron from "node-cron";
import {
  fetchUnprocessedReceipts,
  getReceipt,
  markAsProcessed,
} from "./checkValidReceipts.js";

function startCronJobs() {
  // This will run every 5 minutes
  //!   cron.schedule("*/5 * * * *", async () => {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running cron job every 30 minutes");
    // Fetch unprocessed receipt IDs from the database
    const unprocessedReceipts = await fetchUnprocessedReceipts();
    if (!unprocessedReceipts.length) {
      return;
    }
    const receiptData = await getReceipt(unprocessedReceipts);
    await markAsProcessed(receiptData);
  });
}

export { startCronJobs };
