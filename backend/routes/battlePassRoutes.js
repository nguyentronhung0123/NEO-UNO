const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const battlePassController = require('../controllers/battlePassController');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) {
        const user = await User.findById(decoded.id);
        if (user && !user.isBanned) {
          req.user = user;
        }
      }
    } catch {}
  }
  next();
};

router.get('/status', optionalAuth, battlePassController.getBattlePassStatus);
router.post('/claim', optionalAuth, battlePassController.claimLevelReward);
router.post('/claim-all', optionalAuth, battlePassController.claimAllRewards);
router.post('/upgrade', optionalAuth, battlePassController.upgradeToPremium);

module.exports = router;
