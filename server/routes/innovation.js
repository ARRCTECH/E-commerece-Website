const express = require("express");
const {
  getAllInnovations,
  createInnovation,
  updateInnovation,
  deleteInnovation,
  getActiveInnovations,
} = require("../controllers/innovationController");
const { protect, adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getActiveInnovations);

router.get("/admin", protect, adminAuth, getAllInnovations);
router.post("/", protect, adminAuth, upload.single("image"), createInnovation);
router.put("/:id", protect, adminAuth, upload.single("image"), updateInnovation);
router.delete("/:id", protect, adminAuth, deleteInnovation);

module.exports = router;