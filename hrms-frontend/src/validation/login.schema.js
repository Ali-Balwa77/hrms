import { generateSchema } from "../utils/validators";

export const loginSchema = generateSchema([
  { name: 'emailOrEmployeeId', label: 'Email or Employee No', type: 'text', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true, min: 6 },
]);
