const crypto = require('crypto');
const { users } = require('./store');
const { HttpError } = require('./utils/errors');

const sessions = new Map();
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 24);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 15000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, hashedValue) {
  const [salt, storedHash] = hashedValue.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 15000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'));
}

function registerUser({ email, password, displayName }) {
  const normalizedEmail = email.toLowerCase();
  const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new HttpError(409, 'EMAIL_IN_USE', 'Email is already registered');
  }
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();
  const user = {
    id,
    email: normalizedEmail,
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
  cleanupSessions();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const token = crypto.randomUUID();
  sessions.set(token, {
    userId: user.id,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return { token, user: sanitizeUser(user) };
}

function logoutUser(token) {
  if (!token) {
    return;
  }
  sessions.delete(token);
}

function getUserFromToken(token) {
  if (!token) {
    return null;
  }
  cleanupSessions();
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  const user = users.find((item) => item.id === session.userId);
  if (!user) {
    sessions.delete(token);
    return null;
  }
  return sanitizeUser(user);
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt && session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserFromToken,
  sanitizeUser,
};
