const express = require("express")
const {
  getAllKsauniTshirts,
  createKsauniTshirt,
  updateKsauniTshirt,
  deleteKsauniTshirt,
} = require("../controllers/ksauniTshirtController")
const { protect } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Public routes
router.get("/", getAllKsauniTshirts) // GET /api/ksauni-tshirt

// Protected routes (authentication required)
router.post("/", protect, upload.single("image"), createKsauniTshirt)
router.put("/:id", protect, upload.single("image"), updateKsauniTshirt)
router.delete("/:id", protect, deleteKsauniTshirt)

module.exports = router
