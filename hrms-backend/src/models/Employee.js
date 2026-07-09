import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeNo: { 
      type: String, 
      unique: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    officeEmail: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    phone: String,
    dob: Date,
    designation: String,
    department: String,
    joinDate: Date,
    probationPeriodMonths: {
      type: Number,
      default: 6,
      min: 0,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      default: 'Male'
    },
    employeeType: {
      type: String,
    },
    password: {
      type: String,
      required: false,
      minlength: 6
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },
    leaveBalance: [
      {
        leaveType: {
          type: String,
          required: true
        },

        totalLeave: {
          type: Number,
          default: 0
        },

        originalTotalLeave: {
          type: Number,
          default: 0,
        },

        allocationMode: {
          type: String,
          enum: ["normal", "quarterly"],
          default: "normal"
        },

        quarter: {
          type: String,
          enum: ["Q1", "Q2", "Q3", "Q4", null],
          default: null
        },

        year: {
          type: Number,
          default: null
        },

        validFrom: {
          type: Date,
          default: null
        },

        validTo: {
          type: Date,
          default: null
        }
      }
    ],
    leaveForwardTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
      }
    ],
    previousEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },
    punchId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

employeeSchema.index({ status: 1 });
employeeSchema.index({ createdAt: -1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ joinDate: 1 });
employeeSchema.index({ employeeType: 1, status: 1 });
employeeSchema.index({ leaveForwardTo: 1, status: 1, createdAt: -1 });
employeeSchema.index({ reportingTo: 1, status: 1, createdAt: -1 });
employeeSchema.index({ organization: 1, status: 1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeNo) {
    try {
      
      const lastEmployee = await this.constructor.findOne().sort({ employeeNo: -1 });
      
      if (lastEmployee && lastEmployee.employeeNo) {
        
        const lastNumber = parseInt(lastEmployee.employeeNo.replace('MC', ''));
        const newNumber = lastNumber + 1;
        this.employeeNo = `MC${newNumber.toString().padStart(7, '0')}`;
      } else {
        
        this.employeeNo = 'MC0000001';
      }
    } catch (error) {
      
      this.employeeNo = 'EMP00001';
    }
  }
  next();
});


const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
