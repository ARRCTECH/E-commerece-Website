const express = require('express');
const router = express.Router();
const {
  getConfig,
  updateReferredBy,
  updateReferredTo
} = require('../controllers/referralController');

router.get('/', getConfig);
router.put('/referred-by', updateReferredBy);
router.put('/referred-to', updateReferredTo);

module.exports = router;