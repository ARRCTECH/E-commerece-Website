 const express = require('express');
 const router = express.Router();
 const {
   getReferralDetails,
   updateReferralDetails,
   updateReferralDetailswithoutSaving,
   forceZeroAfterPaymentDone
 } = require('../controllers/fetchReferalDetails');
 
 router.post('/fetchReferral', getReferralDetails);
 router.put('/updatefetchReferral', updateReferralDetails);
 if(updateReferralDetailswithoutSaving){
   router.post('/updateReferralDetailsW', updateReferralDetailsW);
 }
 router.post('/forceZeroAfterPaymentDone',forceZeroAfterPaymentDone)
 
 module.exports = router;