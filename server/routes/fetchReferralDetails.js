 const express = require('express');
 const router = express.Router();
 const {
   getReferralDetails,
   updateReferralDetails,
   updateReferralDetailsW,
   forceZeroAfterPaymentDone
 } = require('../controllers/fetchReferalDetails');
 
 router.post('/fetchReferral', getReferralDetails);
 router.put('/updatefetchReferral', updateReferralDetails);
 router.post('/updatefetchReferralW', updateReferralDetailsW);
 router.post('/forceZeroAfterPaymentDone',forceZeroAfterPaymentDone)
 
 module.exports = router;