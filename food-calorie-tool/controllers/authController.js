const bcrypt = require('bcrypt');
const User = require('../models/User');
const { clearSessionCookie, getSessionToken, normalizeEmail, resolveUserRole, setSessionCookie } = require('../lib/auth');
const { createAuthPayload, syncUserRole } = require('../services/authService');
const { createSession, deleteSessionByToken } = require('../services/sessionService');

function getRequestMetadata(req) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}

async function register(req, res) {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = resolveUserRole(email);
    const user = await User.create({ email, password: hashedPassword, role });
    const { token, expiresAt } = await createSession(user, getRequestMetadata(req));

    setSessionCookie(res, token, expiresAt);

    return res.status(201).json({
      message: 'Registration successful',
      ...createAuthPayload(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    user = await syncUserRole(user);
    const { token, expiresAt } = await createSession(user, getRequestMetadata(req));

    setSessionCookie(res, token, expiresAt);

    return res.json({
      message: 'Login successful',
      ...createAuthPayload(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

async function getCurrentUser(req, res) {
  try {
    let user = await User.findById(req.authUser.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user = await syncUserRole(user);

    return res.json({
      user: {
        email: user.email,
        userId: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

async function logout(req, res) {
  try {
    const token = getSessionToken(req);

    await deleteSessionByToken(token);
    clearSessionCookie(res);

    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
};
