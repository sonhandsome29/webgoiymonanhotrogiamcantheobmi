const express = require('express');
const { getCurrentUser, login, logout, register } = require('../controllers/authController');
const { requireAuth } = require('../lib/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/auth/me', requireAuth, getCurrentUser);

module.exports = router;
