export const errorResponse = (res, status, message, name = "Error") => {
  return res.status(status).json({
    success: false,
    error: {
      name,
      message
    }
  });
};