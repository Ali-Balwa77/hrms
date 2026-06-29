import mongoose from "mongoose";

const leaveCancellationSchema = new mongoose.Schema(
  {
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      required: true
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    forwardTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },

    appliedDateCancel: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    sanctionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sanctionOn: { type: Date, default: null },
    sanctionFrom: { type: Date, default: null },
    sanctionTo: { type: Date, default: null },
    sanctionRemarks: {type: String, default: null},
    sanctionedDays: {type: Number, default: null},
  },
  {
    timestamps: true
  }
);


leaveCancellationSchema.index({ employeeId: 1, status: 1, createdAt: -1 });
leaveCancellationSchema.index({ forwardTo: 1, status: 1 });
leaveCancellationSchema.index({ leaveId: 1 });
const LeaveCancellation = mongoose.model( "LeaveCancellation", leaveCancellationSchema );

export default LeaveCancellation;
