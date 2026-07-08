import { generateSchema } from "../utils/validators";

export const organizationSchema = generateSchema([
    { name: 'name', type: 'text', required: true, pattern: /^[A-Za-z\s.]+$/, patternMessage: "Name can only contain letters", max: 30 },
    { name: 'code', type: 'text', required: true, pattern: /^[A-Za-z0-9\s-]+$/, patternMessage: "Code must be alphanumeric", max: 20 },
    { name: 'email', type: 'email', required: true, },
    { name: 'phone', type: 'text', required: true, pattern: /^\+\d{1,4}\s?[0-9]{10}$/, patternMessage: "Phone number must include a valid country code and a 10-digit mobile number.",max: 16 },
    { name: 'address', type: 'text', required: true,  pattern: /^[A-Za-z0-9\s.,-]+$/, patternMessage: "Address can only contain letters and numbers", max: 100 },
    { name: 'website', type: 'url', required: true, },
    { name: 'description', type: 'text', required: true, max: 200 },
]);
