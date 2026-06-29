import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    forwardTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },

    from: {
      type: Date,
      required: true,
    },

    to: {
      type: Date,
      required: true,
    },

    resumeDate: {
      type: Date,
      required: true,
    },

    appliedDate: {
      type: Date,
      default: Date.now,
    },

    isHalfDay: {
      type: Boolean,
      default: false,
    },

    halfDayType: {
      type: String,
      enum: ['pre', 'post', ''], 
      default: '',
    },

    // Multi-day half leave fields
    halfLeaveForFirstDay: { type: Boolean, default: false },
    firstDayHalfType: { type: String, enum: ['pre', 'post', ''], default: '' },
    halfLeaveForLastDay: { type: Boolean, default: false },
    lastDayHalfType: { type: String, enum: ['pre', 'post', ''], default: '' },

    noOfDays: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    remarks: {
      type: String,
    },

    address: {
      type: String,
    },

    phone: {
      type: String,
    },

    prefix: {
      type: String,
    },

    suffix: {
      type: String,
    },

    coffDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    sanctionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sanctionOn: { type: Date, default: null },
    sanctionFrom: { type: Date, default: null },
    sanctionTo: { type: Date, default: null },
    sanctionRemarks: {type: String, default: null},
    sanctionedDays: {type: Number, default: null},
  },
  { timestamps: true }
);
leaveSchema.index({ employeeId: 1, status: 1, from: 1, to: 1 });
leaveSchema.index({ forwardTo: 1, status: 1 });


leaveSchema.index({ status: 1, from: 1, to: 1 });
leaveSchema.index({ createdAt: -1 });
leaveSchema.index({ leaveType: 1, status: 1 });
const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;

