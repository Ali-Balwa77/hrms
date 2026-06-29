import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: String, 
    required: true
  },
  punches: [
    {
      type: {
        type: String,
      },
      in: {
        type: String
      },
      out: {
        type: String
      },
      action: {
        type: String, 
        default: null
      },
      mispunchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mispunch",
        default: null
      }
    }
  ],
  checkIn: String,   
  checkOut: String,  
  totalHours: {type: String, default: '00:00:00'} 
}, { timestamps: true });
attendanceSchema.index({ date: 1 });


attendanceSchema.index({ employeeId: 1, createdAt: -1 });
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
const attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

export default attendance;