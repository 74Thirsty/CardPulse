const crypto = require('crypto');
const { users } = require('./store');

const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 15000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, hashedValue) {
  const [salt, storedHash] = hashedValue.split(':');
  const hash = crypto
    .pbkdf2Sync(password, salt, 15000, 64, 'sha512')
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'));
}

function registerUser({ email, password, displayName }) {
  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('EMAIL_IN_USE');
  }
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();
  const user = {
    id,
    email,
    displayName,
    passwordHash,
    createdAt,
    rating: 5,
    badges: ['newcomer'],
  };
  users.push(user);
  return sanitizeUser(user);
}

function loginUser({ email, password }) {
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const token = crypto.randomUUID();
  sessions.set(token, {
    userId: user.id,
    issuedAt: Date.now(),
  });
  return { token, user: sanitizeUser(user) };
}

function getUserFromToken(token) {
  if (!token) {
    return null;
  }
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  const user = users.find((item) => item.id === session.userId);
  if (!user) {
    return null;
  }
  return sanitizeUser(user);
}

function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  registerUser,
  loginUser,
  getUserFromToken,
};
