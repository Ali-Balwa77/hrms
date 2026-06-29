import { generateSchema } from "../utils/validators";

const today = new Date();

export const leaveSchema =  (mode) => generateSchema([
    { name: 'forwardTo', label: 'Forward To', type: 'select', required: true },
    { name: 'leaveType', label: 'Leave Type', type: 'select', required: true },
    { name: 'from', label: 'Leave From', type: 'date', required: true},
    { name: 'to', label: 'Leave To', type: 'date', required: true, minField: 'from' },
    { name: 'resumeDate', label: 'Resume Date', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'text', required: true },
    { name: 'noOfDays', label: 'No of Days', type: 'text', required: true },
    { name: 'coffDate', label: 'C/off Present Date', type: 'date' },
], mode)
