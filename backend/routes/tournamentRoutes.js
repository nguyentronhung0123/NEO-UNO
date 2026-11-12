const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const tournamentController = require('../controllers/tournamentController');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';

// Middleware nhận diện người dùng (Hỗ trợ cả Đăng Nhập & Chơi Thử / Khách)
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

router.post('/join', optionalAuth, tournamentController.joinTournament);
router.get('/:id', optionalAuth, tournamentController.getTournament);
router.post('/:id/match-result', optionalAuth, tournamentController.submitMatchResult);
router.post('/:id/claim-reward', optionalAuth, tournamentController.claimReward);

module.exports = router;
