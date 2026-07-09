import cron from "node-cron";
import { removeExpiredQuarterlyBalances } from "../utils/removeExpiredQuarterlyBalances.js";

export const startQuarterlyLeaveCleanupJob = () => {
  cron.schedule("5 0 * * *", async () => {
    try {
      console.log("Expired quarterly leave cleanup started");

      const result = await removeExpiredQuarterlyBalances();

      console.log("Expired quarterly leave cleanup completed", {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Expired quarterly leave cleanup failed:", error);
    }
  });
};