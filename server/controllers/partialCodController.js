const PartialCodSetting = require("../models/PartialCodSetting");

// Get settings (percentage + isEnabled)
exports.getSettings = async (req, res) => {
  try {
    let setting = await PartialCodSetting.findOne();
    
    if (!setting) {
      // Create default record if not exists
      setting = await PartialCodSetting.create({ 
        percentage: 30, 
        isEnabled: true 
      });
    }
    
    res.json({ 
      success: true, 
      percentage: setting.percentage,
      isEnabled: setting.isEnabled
    });
  } catch (error) {
    res.json({ 
      success: true, 
      percentage: 30, 
      isEnabled: true 
    });
  }
};

// Update settings (percentage + isEnabled)
exports.updateSettings = async (req, res) => {
  try {
    const { percentage, isEnabled } = req.body;
    const userId = req.user.userId;
    
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return res.status(400).json({ 
        success: false, 
        message: "Percentage must be between 0 and 100" 
      });
    }
    
    let setting = await PartialCodSetting.findOne();
    
    if (setting) {
      if (percentage !== undefined) setting.percentage = percentage;
      if (isEnabled !== undefined) setting.isEnabled = isEnabled;
      setting.updatedBy = userId;
      await setting.save();
    } else {
      setting = await PartialCodSetting.create({ 
        percentage: percentage || 30, 
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        updatedBy: userId 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Partial COD settings updated successfully",
      percentage: setting.percentage,
      isEnabled: setting.isEnabled
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};