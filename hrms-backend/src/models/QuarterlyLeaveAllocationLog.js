import mongoose from "mongoose";

const quarterlyLeaveAllocationLogSchema = new mongoose.Schema(
    {
        policyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuarterlyLeavePolicy",
            required: true,
        },

        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },

        leaveType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeaveType",
            required: true,
        },

        year: {
            type: Number,
            required: true,
        },

        quarter: {
            type: String,
            required: true,
        },

        allocatedDays: {
            type: Number,
            required: true,
        },

        carryForward: {
            type: Boolean,
            default: false,
        },

        validFrom: {
            type: Date,
            required: true,
        },

        validTo: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

quarterlyLeaveAllocationLogSchema.index(
    { policyId: 1, employeeId: 1 },
    { unique: true }
);

quarterlyLeaveAllocationLogSchema.index({ employeeId: 1, year: 1, quarter: 1 });
quarterlyLeaveAllocationLogSchema.index({ year: 1, quarter: 1 });


const QuarterlyLeaveAllocationLog = mongoose.model("QuarterlyLeaveAllocationLog", quarterlyLeaveAllocationLogSchema);

export default QuarterlyLeaveAllocationLog;