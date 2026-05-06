const PopupSetting = require("../models/PopupSetting");

// Get popup setting
exports.getPopupSetting = async (req, res) => {
  try {
    let setting = await PopupSetting.findOne();
    if (!setting) {
      setting = new PopupSetting();
      await setting.save();
    }
    res.status(200).json({ 
      showSalePopup: setting.showSalePopup,
      popupBanners: setting.popupBanners || []
    });
  } catch (error) {
    console.error("Get popup setting error:", error);
    res.status(500).json({ message: "Failed to fetch popup setting" });
  }
};

// Update popup setting
exports.updatePopupSetting = async (req, res) => {
  try {
    const { showSalePopup, popupBanners } = req.body;
    let setting = await PopupSetting.findOne();
    if (!setting) {
      setting = new PopupSetting();
    }
    if (typeof showSalePopup === "boolean") {
      setting.showSalePopup = showSalePopup;
    }
    if (Array.isArray(popupBanners)) {
      setting.popupBanners = popupBanners;
    }
    await setting.save();
    res.status(200).json({ 
      message: "Popup setting updated", 
      showSalePopup: setting.showSalePopup,
      popupBanners: setting.popupBanners
    });
  } catch (error) {
    console.error("Update popup setting error:", error);
    res.status(500).json({ message: "Failed to update popup setting" });
  }
};
