import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


designationSchema.index({ status: 1 });
designationSchema.index({ name: 1, status: 1 });
const Designation = mongoose.model("Designation", designationSchema);

export default Designation;