import { generateSchema } from "../utils/validators";

export const forgotPasswordSchema = generateSchema([
    { name: 'email', label: 'Email', type: 'email', required: true },
]);
