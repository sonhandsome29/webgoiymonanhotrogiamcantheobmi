const crypto = require('crypto');
const AuthSession = require('../models/AuthSession');

const SESSION_TTL_DAYS = Number.parseInt(process.env.SESSION_TTL_DAYS, 10) || 7;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function getSessionDurationMs() {
  return SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
}

function buildSessionMetadata(metadata = {}) {
  return {
    userAgent: String(metadata.userAgent || '').slice(0, 512),
    ipAddress: String(metadata.ipAddress || '').slice(0, 128),
  };
}

async function createSession(user, metadata = {}) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + getSessionDurationMs());
  const session = await AuthSession.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt,
    lastSeenAt: new Date(),
    ...buildSessionMetadata(metadata),
  });

  return {
    token,
    expiresAt,
    session,
  };
}

async function resolveSession(token) {
  if (!token) return null;

  const session = await AuthSession.findOne({ tokenHash: hashToken(token) }).populate('userId');

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date() || !session.userId) {
    await session.deleteOne();
    return null;
  }

  const lastSeenAt = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;

  if (Date.now() - lastSeenAt >= SESSION_TOUCH_INTERVAL_MS) {
    session.lastSeenAt = new Date();
    await session.save();
  }

  return session;
}

async function deleteSessionByToken(token) {
  if (!token) return;

  await AuthSession.deleteOne({ tokenHash: hashToken(token) });
}

async function deleteSessionsByUserId(userId) {
  if (!userId) return;

  await AuthSession.deleteMany({ userId });
}

module.exports = {
  createSession,
  deleteSessionByToken,
  deleteSessionsByUserId,
  resolveSession,
};
