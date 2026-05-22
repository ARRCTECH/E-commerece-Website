const express = require('express');
const router = express.Router();
const {
saveReturnReason,
getReturnReasons
} = require('../controllers/returnReasonController');

router.post("/returnvaluesave",saveReturnReason)
router.get("/returnvaluesave",getReturnReasons)
module.exports = router;
