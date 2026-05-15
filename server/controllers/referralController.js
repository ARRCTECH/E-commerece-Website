const ReferralConfig = require('../models/ReferralConfig');

const addExpiredFlag = (doc) => {
  if (!doc) return null;
  const now = new Date();
  return {
    ...doc.toObject(),
    referredBy: {
      ...doc.referredBy,
      expired: doc.referredBy.expiry < now
    }
  };
};

exports.getConfig = async (req, res) => {
  try {
    let config = await ReferralConfig.findOne();
    if (!config) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      config = new ReferralConfig({
        referredBy: { active: true, type: 'percentage', value: 10, expiry: defaultExpiry }
      });
      await config.save();
    }
    res.json(addExpiredFlag(config));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const validateDiscount = (discount, fieldName) => {
  if (!discount) throw new Error(`${fieldName} is required`);
  if (!['percentage', 'fixed'].includes(discount.type)) {
    throw new Error(`${fieldName}.type must be 'percentage' or 'fixed'`);
  }
  if (typeof discount.value !== 'number' || discount.value < 0) {
    throw new Error(`${fieldName}.value must be a positive number`);
  }
  if (!discount.expiry || isNaN(new Date(discount.expiry))) {
    throw new Error(`${fieldName}.expiry must be a valid date`);
  }
};

exports.updateReferrerConfig = async (req, res) => {
  try {
    const { referredBy } = req.body;
    validateDiscount(referredBy, 'referredBy');
    const processed = {
      ...referredBy,
      expiry: new Date(referredBy.expiry)
    };
    let config = await ReferralConfig.findOne();
    if (!config) {
      config = new ReferralConfig({ referredBy: processed });
    } else {
      config.referredBy = processed;
    }
    await config.save();
    res.json(addExpiredFlag(config));
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};