import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, },
    code: { type: String, unique: true },
    address: String,
    website: String,
    email: String,
    phone: String,
    description: String,
    quarterlyLeaveAllocationEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


organizationSchema.index({ name: 1 });
organizationSchema.index({ email: 1 });
const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
