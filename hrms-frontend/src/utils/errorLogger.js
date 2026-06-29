export const logError = (label, error) => {
  console.error(label, error?.response?.data || error?.message || error);
};

export default logError;
