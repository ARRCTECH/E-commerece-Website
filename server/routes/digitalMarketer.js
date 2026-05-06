const express = require("express");
const {
  getMarketingAnalytics,
  getSEOData,
  updateSEOData,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignAnalytics,
} = require("../controllers/digitalMarketerController");

const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

const { protect, digitalMarketerAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Apply authentication to all digital marketer routes
router.use(protect);
router.use(digitalMarketerAuth);

// -----------------------------
// Marketing Analytics
// -----------------------------
router.get("/analytics", getMarketingAnalytics);

// -----------------------------
// Promo Banners Management
// -----------------------------
router.get("/banners", getAllBanners);
router.post("/banners", upload.single("image"), createBanner);
router.put("/banners/:id", upload.single("image"), updateBanner);
router.delete("/banners/:id", deleteBanner);

// -----------------------------
// SEO Management
// -----------------------------
router.get("/seo", getSEOData);
router.post("/seo", updateSEOData);

// -----------------------------
// Campaign Management
// -----------------------------
router.get("/campaigns", getAllCampaigns);
router.post("/campaigns", createCampaign);
router.put("/campaigns/:campaignId", updateCampaign);
router.delete("/campaigns/:campaignId", deleteCampaign);
router.get("/campaigns/:campaignId/analytics", getCampaignAnalytics);

module.exports = router;
