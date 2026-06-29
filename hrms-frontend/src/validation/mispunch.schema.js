import { generateSchema } from "../utils/validators";

export const mispunchSchema = (mode) => generateSchema(
  [
    { name: "forwardTo", label: "Forward To employee", type: "text", required: true },
    { name: "mispunchDate", label: "Mispunch Date", type: "date", required: true },
    { name: "startHour", label: "Start Hour", type: "text", required: true },
    { name: "startMinute", label: "Start Minute", type: "text", required: true },
    { name: "endHour", label: "End Hour", type: "text", required: true },
    { name: "endMinute", label: "End Minute", type: "text", required: true },
    { name: "reason", label: "Reason", type: "text", required: true, max: 200 },
    { name: "remarks", label: "Remarks", type: "text", max: 200 },
    { name: "mispunchOccurs", label: "Mispunch Occurs", type: "text", required: true },
  ],
  mode
);

export const mispunchDecisionSchema = (mode) => generateSchema(
  [
    { name: "status", label: "Decision", type: "text", required: true },
    { name: "sanctionRemarks", label: "Decision remarks", type: "text", max: 200 },
  ],
  mode
);
