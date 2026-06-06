/**
 * asyncHandler — Higher-order function that wraps async route controllers.
 * Eliminates repetitive try/catch blocks across controllers.
 * Caught rejections are forwarded to Express's global error handler via next().
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
