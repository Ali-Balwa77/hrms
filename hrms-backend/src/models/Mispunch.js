import mongoose from "mongoose";

const mispunchSchema = new mongoose.Schema(
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
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    mispunchDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    durationHours: {
      type: String,
      default: "00:00",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    mispunchOccurs: {
      type: String,
      enum: ["pre", "post"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    sanctionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sanctionOn: {
      type: Date,
      default: null,
    },
    sanctionRemarks: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

mispunchSchema.index({ employeeId: 1, status: 1, createdAt: -1 });
mispunchSchema.index({ forwardTo: 1, status: 1, createdAt: -1 });
mispunchSchema.index({ mispunchDate: 1 });

const Mispunch = mongoose.models.Mispunch || mongoose.model("Mispunch", mispunchSchema);

export default Mispunch;
