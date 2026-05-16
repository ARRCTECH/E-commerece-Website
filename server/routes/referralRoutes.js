const express = require('express');
const router = express.Router();
const {
  getReferralConfig,
  updateReferralConfig,
} = require('../controllers/referralController');

router.get('/', getReferralConfig);
router.put('/referral', updateReferralConfig);

module.exports = router;