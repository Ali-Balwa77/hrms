import cron from "node-cron";
import { refillAnnualLeaveBalances } from "../utils/refillAnnualLeaveBalances.js";

export const startAnnualLeaveRefillJob = () => {
  cron.schedule("10 0 1 1 *", async () => {
    try {
      console.log("Annual leave refill started");

      const result = await refillAnnualLeaveBalances();

      console.log("Annual leave refill completed", result);
    } catch (error) {
      console.error("Annual leave refill failed:", error);
    }
  });
};
