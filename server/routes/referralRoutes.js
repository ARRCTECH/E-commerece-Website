const express = require('express');
const router = express.Router();
const {
  getConfig,
  updateReferrerConfig  
} = require('../controllers/referralController');

router.get('/', getConfig);
router.put('/referrer', updateReferrerConfig);

module.exports = router;