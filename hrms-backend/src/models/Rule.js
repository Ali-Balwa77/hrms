import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


ruleSchema.index({ isActive: 1, createdAt: -1 });
ruleSchema.index({ title: 1 });
const Rule = mongoose.model('Rule', ruleSchema);

export default Rule;

