const express = require('express');
const router = express.Router();
const {
  getReferralTotalEarning,
  updateReferralTotalEarning,
  createReferralTotalEarning
} = require('../controllers/referraltotalearning');

router.post('/', getReferralTotalEarning);
router.put('/update', updateReferralTotalEarning);
router.post('/create', createReferralTotalEarning);

module.exports = router;