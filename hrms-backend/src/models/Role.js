import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    actions: [{ type: String }],
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    permissions: [permissionSchema],
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);



roleSchema.index({ isActive: 1 });
roleSchema.index({ name: 1, isActive: 1 });
const Role = mongoose.model("Role", roleSchema);

export default Role;
