const crypto = require('crypto');

const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'dev-auth-secret-change-me';
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(payloadSegment) {
  return crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadSegment)
    .digest('base64url');
}

function getTokenTtlMs() {
  const raw = Number(process.env.AUTH_TOKEN_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TOKEN_TTL_MS;
}

function signAuthToken(user) {
  const payload = {
    sub: String(user._id),
    role: user.role || 'user',
    exp: Date.now() + getTokenTtlMs(),
  };

  const payloadSegment = toBase64Url(JSON.stringify(payload));
  const signatureSegment = createSignature(payloadSegment);
  return `${payloadSegment}.${signatureSegment}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing token');
  }

  const [payloadSegment, signatureSegment] = token.split('.');
  if (!payloadSegment || !signatureSegment) {
    throw new Error('Malformed token');
  }

  const expectedSignature = createSignature(payloadSegment);
  if (signatureSegment !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(fromBase64Url(payloadSegment));
  if (!payload?.sub || !payload?.role || !payload?.exp) {
    throw new Error('Invalid token payload');
  }

  if (payload.exp <= Date.now()) {
    throw new Error('Token expired');
  }

  return payload;
}

function extractBearerToken(headerValue = '') {
  const [scheme, token] = String(headerValue).split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

module.exports = {
  extractBearerToken,
  signAuthToken,
  verifyAuthToken,
};
