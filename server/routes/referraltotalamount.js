const express = require('express');
const router = express.Router();
const {
  getReferralTotalEarning,
  addReferralEarnings,
  useReferralBalance,
  createReferralTotalEarning
} = require('../controllers/referraltotalearning');

router.post('/getReferralTotalEarning',getReferralTotalEarning)
router.post('/addReferralEarnings',addReferralEarnings)
router.post('/useReferralBalance',useReferralBalance)
router.post('/createReferralTotalEarning',createReferralTotalEarning)

module.exports = router;