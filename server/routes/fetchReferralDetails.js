 const express = require('express');
 const router = express.Router();
 const {
   getReferralDetails,
   updateReferralDetails,
   updateReferralDetailswithoutSaving
 } = require('../controllers/fetchReferalDetails');
 
 router.post('/fetchReferral', getReferralDetails);
 router.put('/updatefetchReferral', updateReferralDetails);
  router.post('/updatefetchReferralwithoutSaving', updateReferralDetailswithoutSaving);
 
 module.exports = router;