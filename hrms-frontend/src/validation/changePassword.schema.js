import { generateSchema } from "../utils/validators";

export const changePasswordSchema = generateSchema([
  { name: 'oldPassword', label: 'Old Password', type: 'password', required: true },
  { name: 'newPassword', label: 'New Password', type: 'password', required: true, min: 6 },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, oneOf: ['newPassword'] },
]);
