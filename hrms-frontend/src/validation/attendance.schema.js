import { generateSchema } from "../utils/validators";

export const attendanceSchema = (role) => {
  generateSchema([
    { name: 'selectEmployee', label: 'Select Employee', type: 'select', required: (role) => role !== "employee" },
  ], role);
}
