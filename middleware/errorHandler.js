const crypto = require('crypto');
const { NODE_ENV } = require('../config/env');
const AppError = require('./AppError');

function getRequestId(req) {
  return req.headers['x-request-id'] || req.id || crypto.randomUUID();
}

function errorHandler(err, req, res, next) {
  const requestId = getRequestId(req);
  const statusCode = err instanceof AppError ? err.statusCode : err.statusCode || 500;
  const message = err instanceof AppError || err.message ? err.message : 'حدث خطأ في الخادم';

  const payload = { success: false, message };

  if (err instanceof AppError && err.errors) {
    payload.errors = err.errors;
  }

  if (err.name === 'ZodError' || err.name === 'ValidationError') {
    payload.errors = err.errors || err.issues || [];
    return res.status(400).json(payload);
  }

  if (NODE_ENV === 'production') {
    console.error({ requestId, statusCode, message, name: err.name });
  } else {
    console.error({ requestId, statusCode, message, name: err.name, stack: err.stack });
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
