import { logger } from '../utils/logger.js';

const isDatabaseConnectionError = (error) => {
  return (
    error?.name === 'MongoServerSelectionError' ||
    error?.name === 'MongoNetworkTimeoutError' ||
    error?.name === 'MongoNetworkError' ||
    error?.reason?.type === 'ReplicaSetNoPrimary' ||
    error?.message?.includes('secureConnect') ||
    error?.message?.includes('connectTimeoutMS') ||
    error?.message?.includes('timed out')
  );
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  const payload = {
    success: false,
    message: err.message || 'Internal server error',
    meta: {
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    },
  };

  if (isDatabaseConnectionError(err)) {
    statusCode = 503;
    payload.message = 'Unable to connect. Please check your internet connection or HRMS server.';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    payload.message = 'Invalid resource id';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    payload.message = 'Validation failed';
    payload.errors = Object.values(err.errors || {}).map((error) => error.message);
  }

  if (err.code === 11000) {
    statusCode = 409;
    payload.message = 'Duplicate value already exists';
    payload.errors = Object.keys(err.keyValue || {});
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
    });
  }

  if (!isProduction) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};
