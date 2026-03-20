const express = require('express');
const { getMealHistoryByDay, getMealHistoryByUser, saveMealHistory } = require('../controllers/historyController');

const router = express.Router();

router.post('/meal-history', saveMealHistory);
router.get('/meal-history/:userId/:day', getMealHistoryByDay);
router.get('/meal-history/:userId', getMealHistoryByUser);

module.exports = router;
