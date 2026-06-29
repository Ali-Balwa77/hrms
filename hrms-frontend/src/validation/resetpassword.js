import { generateSchema } from "../utils/validators";

export const resetPasswordSchema = generateSchema([
  { name: 'newPassword', label: 'New Password', type: 'password', required: true, min: 6 },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, oneOf: 'newPassword' },
]);
