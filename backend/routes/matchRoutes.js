const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.post('/record', matchController.recordMatch);
router.get('/history', matchController.getMatchHistory);
router.get('/my-history', matchController.getMyMatchHistory);

module.exports = router;
