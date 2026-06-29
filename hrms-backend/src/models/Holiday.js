import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, },
    date: { type: Date, required: true },
    day: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);


holidaySchema.index({ date: 1 });
holidaySchema.index({ name: 1 });
const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;

