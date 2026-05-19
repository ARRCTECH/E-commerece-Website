 const express = require('express');
 const router = express.Router();
 const {
   getReferralDetails,
   updateReferralDetails,
 } = require('../controllers/fetchReferalDetails');
 
 router.post('/fetchReferral', getReferralDetails);
 router.put('/updatefetchReferral', updateReferralDetails);
 
 module.exports = router;