const { HttpError } = require('./errors');

function validationError(field, message) {
  return new HttpError(400, 'INVALID_PAYLOAD', `${field}: ${message}`);
}

function requireString(value, field, options = {}) {
  if (typeof value !== 'string') {
    throw validationError(field, 'must be a string');
  }
  const trimmed = options.trim === false ? value : value.trim();
  if (options.minLength && trimmed.length < options.minLength) {
    throw validationError(field, `must be at least ${options.minLength} characters`);
  }
  if (options.maxLength && trimmed.length > options.maxLength) {
    throw validationError(field, `must be at most ${options.maxLength} characters`);
  }
  if (options.pattern && !options.pattern.test(trimmed)) {
    throw validationError(field, 'has an invalid format');
  }
  return trimmed;
}

function requireEmail(value, field = 'email') {
  const email = requireString(value, field, { minLength: 5, maxLength: 96 });
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.toLowerCase())) {
    throw validationError(field, 'must be a valid email address');
  }
  return email.toLowerCase();
}

function requirePassword(value, field = 'password') {
  return requireString(value, field, { minLength: 8, maxLength: 128 });
}

function requireNumber(value, field, options = {}) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw validationError(field, 'must be a number');
  }
  if (options.min !== undefined && value < options.min) {
    throw validationError(field, `must be greater than or equal to ${options.min}`);
  }
  if (options.max !== undefined && value > options.max) {
    throw validationError(field, `must be less than or equal to ${options.max}`);
  }
  return value;
}

function optionalString(value, field, options = {}) {
  if (value === undefined || value === null) {
    return null;
  }
  return requireString(value, field, options);
}

function optionalArray(value, field, mapper = (item) => item) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw validationError(field, 'must be an array');
  }
  return value.map(mapper);
}

function requireEnum(value, field, values) {
  if (!values.includes(value)) {
    throw validationError(field, `must be one of: ${values.join(', ')}`);
  }
  return value;
}

module.exports = {
  requireEmail,
  requirePassword,
  requireString,
  requireNumber,
  optionalString,
  optionalArray,
  requireEnum,
  validationError,
};
