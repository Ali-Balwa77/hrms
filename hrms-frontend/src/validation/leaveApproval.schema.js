import { generateSchema } from "../utils/validators";

const today = new Date();

export const leaveApprovalSchema =  (mode) => generateSchema([
    { name: 'sanctionedDays', label: 'No. of Days', type: 'text', required: true },
    { name: 'sanctionOn', label: 'Sanctioned On', type: 'date', required: true, },
    { name: 'sanctionFrom', label: 'Sanctioned From', type: 'date', required: true, },
    { name: 'sanctionTo', label: 'Sanctioned To', type: 'date', required: true, },
    { name: 'sanctionedBy', label: 'Sanctioned By', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'text', required: true },
], mode)
