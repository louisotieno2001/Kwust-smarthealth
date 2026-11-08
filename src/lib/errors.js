class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFound(req, res, next) {
  next(new AppError('Page not found', 404));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const statusCode = error.statusCode || error.status || 500;
  const isApi = req.path.startsWith('/api/');

  if (statusCode >= 500) {
    console.error(error);
  }

  if (isApi) {
    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  }

  const template = statusCode === 403 ? 'errors/403' : statusCode === 404 ? 'errors/404' : 'errors/500';
  return res.status(statusCode).render(template, {
    title: statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'Page not found' : 'Something went wrong',
    message: statusCode >= 500 && !require('../config/env').env.isProduction
      ? error.message
      : undefined,
  });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };
