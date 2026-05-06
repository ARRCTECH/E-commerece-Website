const express = require("express")
const { handleWebhook, getWebhookLogs } = require("../controllers/shiprocketController")

const router = express.Router()

// Webhook routes
router.post("/webhook", handleWebhook)
router.get("/webhook-logs", getWebhookLogs)

module.exports = router
