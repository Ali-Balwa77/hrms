import cron from "node-cron";
import { removeExpiredProbationBalances } from "../utils/removeExpiredProbationBalances.js";

export const startProbationLeaveCleanupJob = () => {
  cron.schedule("15 0 * * *", async () => {
    try {
      console.log("Expired probation leave cleanup started");

      const result = await removeExpiredProbationBalances();

      console.log("Expired probation leave cleanup completed", {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Expired probation leave cleanup failed:", error);
    }
  });
};
