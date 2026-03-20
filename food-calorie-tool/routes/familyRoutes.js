const express = require('express');
const { generateFamilyMenu, getFamilyMinCost } = require('../controllers/familyController');
const { requireAuth } = require('../lib/auth');

const router = express.Router();

router.get('/family/min-cost', getFamilyMinCost);
router.post('/family/menu', requireAuth, generateFamilyMenu);

module.exports = router;
