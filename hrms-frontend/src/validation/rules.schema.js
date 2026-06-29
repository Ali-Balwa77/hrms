import { generateSchema } from "../utils/validators";

export const rulesSchema = generateSchema([
  { name: 'title', label: 'Title', type: 'text', required: true, pattern: /^[a-zA-Z0-9!@#$%^&*_\-+=:'",.()?/\\ ]+$/, patternMessage: "Rules Title Data Invalid"  },
  { name: 'content', label: "Content", type: 'text', required: true, pattern: /^[a-zA-Z0-9!@#$%^&*_\-+=:'",.()?/\\ ]+$/, patternMessage: "Rules Data Invalid" },
]);
