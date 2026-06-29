import mongoose from "mongoose";

const leaveBalanceArchiveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      required: true,
    },

    balanceData: {
      leaveType: String,
      totalLeave: Number,
      originalTotalLeave: Number,
      allocationMode: String,
      quarter: String,
      year: Number,
      validFrom: Date,
      validTo: Date,
    },

    reason: {
      type: String,
      enum: ["leave_type_inactive"],
      default: "leave_type_inactive",
    },
  },
  { timestamps: true }
);

leaveBalanceArchiveSchema.index(
  {
    employee: 1,
    leaveType: 1,
    "balanceData.quarter": 1,
    "balanceData.year": 1,
    "balanceData.allocationMode": 1,
  },
  { unique: true }
);

const LeaveBalanceArchive = mongoose.model(
  "LeaveBalanceArchive",
  leaveBalanceArchiveSchema
);

export default LeaveBalanceArchive;