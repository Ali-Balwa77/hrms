import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    totalDays: {
      type: Number,
      default: 0,
    },

    allocationMode: {
      type: String,
      enum: ["normal", "quarterly"],
      default: "normal",
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


leaveTypeSchema.index({ status: 1, allocationMode: 1 });
leaveTypeSchema.index({ code: 1, status: 1 });
const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

export default LeaveType;