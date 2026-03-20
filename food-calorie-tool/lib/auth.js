const { resolveSession } = require('../services/sessionService');

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || 'admin@example.com')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean)
);

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function resolveUserRole(email = '') {
  return ADMIN_EMAILS.has(normalizeEmail(email)) ? 'admin' : 'user';
}

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sone_session';

function getCookieValue(req, name) {
  const cookieHeader = req.headers.cookie || '';

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const entry of cookies) {
    const [rawKey, ...rawValue] = entry.trim().split('=');

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function getSessionToken(req) {
  return getCookieValue(req, SESSION_COOKIE_NAME);
}

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...getBaseCookieOptions(),
    expires: expiresAt,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, getBaseCookieOptions());
}

async function optionalAuth(req, res, next) {
  const token = getSessionToken(req);

  if (!token) {
    req.authUser = null;
    return next();
  }

  try {
    const session = await resolveSession(token);

    if (!session?.userId) {
      clearSessionCookie(res);
      req.authUser = null;
      return next();
    }

    req.authUser = {
      userId: session.userId._id,
      email: session.userId.email,
      role: session.userId.role || resolveUserRole(session.userId.email),
      sessionId: session._id,
    };
    return next();
  } catch (error) {
    clearSessionCookie(res);
    req.authUser = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.authUser?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}

function ensureSameUser(req, res, userId) {
  if (!req.authUser?.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }

  if (req.authUser.role === 'admin') {
    return true;
  }

  if (String(req.authUser.userId) !== String(userId)) {
    res.status(403).json({ error: 'Forbidden for this user' });
    return false;
  }

  return true;
}

module.exports = {
  clearSessionCookie,
  ensureSameUser,
  getSessionToken,
  normalizeEmail,
  optionalAuth,
  requireAdmin,
  requireAuth,
  resolveUserRole,
  setSessionCookie,
};
