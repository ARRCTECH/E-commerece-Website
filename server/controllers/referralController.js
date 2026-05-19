const ReferralConfig = require('../models/ReferralConfig');
const getReferralConfig = async (req, res) => {
  try {
    let config = await ReferralConfig.findOne();
    if (!config) {
      return res.status(200).json({
        referredBy: {
          active: true,
          type: 'percentage',
          value: 0,
          daysUntilExpiry: 7,
        },
      });
    }
    
    res.status(200).json({
      referredBy: {
        active: config.active,
        type: config.type,
        value: config.value,
        daysUntilExpiry: config.daysUntilExpiry,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE controller – create or update configuration
const updateReferralConfig = async (req, res) => {
  try {
    const { referredBy } = req.body;
    const { active, type, value, daysUntilExpiry } = referredBy;
    if (!type || !['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "percentage" or "fixed".' });
    }
    if (typeof value !== 'number' || value <= 0) {
      return res.status(400).json({ error: 'Value must be a positive number.' });
    }
    if (daysUntilExpiry !== undefined) {
      if (typeof daysUntilExpiry !== 'number' || daysUntilExpiry < 1 || daysUntilExpiry > 366) {
        return res.status(400).json({ error: 'daysUntilExpiry must be between 1 and 366.' });
      }
    }
    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean.' });
    }
    let config = await ReferralConfig.findOne();
    if (!config) {
      config = new ReferralConfig();
    }
    if (active !== undefined) config.active = active;
    if (type) config.type = type;
    if (value) config.value = value;
    if (daysUntilExpiry !== undefined) config.daysUntilExpiry = daysUntilExpiry;
    await config.save();
    res.status(200).json({
      referredBy: {
        active: config.active,
        type: config.type,
        value: config.value,
        daysUntilExpiry: config.daysUntilExpiry,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
module.exports = { getReferralConfig, updateReferralConfig };