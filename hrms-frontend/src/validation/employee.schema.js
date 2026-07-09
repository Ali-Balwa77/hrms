import { generateSchema } from "../utils/validators";

export const employeeSchema = generateSchema([
  { name: 'employeeId', label:'EmployeeID', type: 'text', required: false },
  { name: 'firstName', label:'First Name', type: 'text', required: true, pattern: /^[A-Za-z\s]+$/, patternMessage: 'First Name can only contain letters.' },
  { name: 'lastName', label:'Last Name', type: 'text', required: true, pattern: /^[A-Za-z\s]+$/, patternMessage: 'Last Name can only contain letters.' },
  { name: 'email', label:'Personal Email', type: 'email', required: true },
  { name: 'officeEmail', label:'Office Email', type: 'email', required: true },
  { name: 'gender', label:'Gender', type: 'select', required: true },
  { name: 'phone', type: 'text', required: true, pattern: /^\+\d{1,4}\s?[0-9]{10}$/, patternMessage: "Phone number must include a valid country code and a 10-digit mobile number.",max: 16 },
  { name: 'dob', label:'Date of Birth', type: 'date', required: true },
  { name: 'joinDate', label:'Join Date', type: 'date', required: true },
  { name: 'probationPeriodMonths', label:'Probation Period Months', type: 'number', required: false, integer: true },
  { name: 'department', label:'Department', type: 'text', required: true },
  { name: 'designation', label:'Designation', type: 'text', required: true },
  { name: 'organization', label:'Organization', type: 'select', required: true },
  { name: 'employeeType', label:'Employee Type', type: 'select', required: true },
  { name: 'leaveForwardTo', label:'Leave Forward To', type: 'multiselect', required: true },
]);
