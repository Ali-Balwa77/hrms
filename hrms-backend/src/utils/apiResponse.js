const buildMeta = (meta = {}) => ({
  timestamp: new Date().toISOString(),
  ...meta,
});

export const sendResponse = (
  res,
  statusCode = 200,
  message = 'Success',
  data = null,
  meta = {}
) => {
  const payload = {
    success: statusCode < 400,
    message,
    meta: buildMeta(meta),
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => (
  sendResponse(res, statusCode, message, data, meta)
);

export const sendCreated = (res, data = null, message = 'Created successfully', meta = {}) => (
  sendResponse(res, 201, message, data, meta)
);

export const sendNoContent = (res, message = 'Deleted successfully', meta = {}) => (
  sendResponse(res, 200, message, null, meta)
);

export const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null, meta = {}) => (
  sendResponse(res, statusCode, message, null, errors ? { ...meta, errors } : meta)
);
