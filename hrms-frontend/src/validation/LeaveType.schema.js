import { generateSchema } from "../utils/validators";

const today = new Date();

export const leaveTypeSchema =  (mode) => generateSchema([
    { name: 'name', label: 'Leave Name', type: 'text', required: true, pattern: /^[A-Za-z\s]+$/, patternMessage: 'Leave Name can only contain letters.', max: 20},
    { name: 'code', label: 'Leace Code', type: 'text', required: true, pattern: /^[A-Za-z0-9]+$/, patternMessage: "Leave Code must be alphanumeric", max: 20},
    { name: 'totalDays', label: 'Total Day', type: 'number', required: true, integer: true, integerMessage: "Decimal value is not allowed in Total Days" },
    { name: "allocationMode", label: "Allocation Mode", type: "select", required: true},
], mode)
