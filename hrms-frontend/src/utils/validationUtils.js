export const isFieldRequired = (schema, fieldName) => {

    const field = schema?.fields?.[fieldName];
  return field?.tests?.some((test) => test.OPTIONS.name === "required");
};
