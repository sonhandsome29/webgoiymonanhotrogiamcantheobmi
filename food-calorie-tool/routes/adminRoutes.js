const express = require('express');
const { getAdminUsersOverview } = require('../controllers/adminController');
const { requireAdmin } = require('../lib/auth');

const router = express.Router();

router.get('/admin/users-overview', requireAdmin, getAdminUsersOverview);

module.exports = router;
