import { generateSchema } from "../utils/validators";

export const holidaySchema = generateSchema([
    { name: 'name', label: 'Holiday Name', type: 'text', required: true, pattern: /^[A-Za-z\s]+$/, patternMessage: 'Holiday Name can only contain letters.' },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'day', label: 'Day', type: 'text', required: true, pattern: /^[A-Za-z\s]+$/, patternMessage: 'Holiday can only contain letters.'},
])
