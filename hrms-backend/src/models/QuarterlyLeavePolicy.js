import mongoose from 'mongoose';

const quarterlyLeavePolicySchema = new mongoose.Schema(
  {
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: true,
    },

    leaveDays: {
      type: Number,
      required: true,
      min: 0,
    },

    allocationType: {
      type: String,
      enum: ['fixed', 'prorated', 'manual'],
      default: 'fixed',
      required: true,
    },

    carryForward: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

quarterlyLeavePolicySchema.index(
  { organization: 1, leaveType: 1, year: 1, quarter: 1 },
  { unique: true }
);


quarterlyLeavePolicySchema.index({ organization: 1, status: 1, year: 1, quarter: 1 });
const QuarterlyLeavePolicy = mongoose.model(
  'QuarterlyLeavePolicy',
  quarterlyLeavePolicySchema
);

export default QuarterlyLeavePolicy;
