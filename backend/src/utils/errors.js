class HttpError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message || code);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function createHttpError(statusCode, code, message, details) {
  return new HttpError(statusCode, code, message, details);
}

module.exports = {
  HttpError,
  createHttpError,
};
