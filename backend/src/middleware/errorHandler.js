import env from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors)[0]?.message || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message;
  }

  if (status >= 500) {
    console.error('[error]', err);
    if (env.nodeEnv === 'production' && !err.isOperational) message = 'Internal server error';
  }

  res.status(status).json({ message, ...(err.details ? { details: err.details } : {}) });
};
