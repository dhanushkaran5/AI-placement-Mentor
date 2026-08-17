/**
 * Centralized Backend Error Handling Middleware
 */
export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  console.error(`[API Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorMiddleware;
