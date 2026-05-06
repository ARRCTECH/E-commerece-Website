const express = require("express");
const router = express.Router();

const {
  createReasonApi,
  getAllReasons
} = require("../controllers/submitReason");

// Save reasons
router.post("/cancellation", createReasonApi);

// Get all saved reasons (optional)
router.get("/cancellation", getAllReasons);

module.exports = router;