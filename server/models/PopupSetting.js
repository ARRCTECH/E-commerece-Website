const mongoose = require("mongoose");

const popupSettingSchema = new mongoose.Schema({
  showSalePopup: {
    type: Boolean,
    default: false,
  },
  popupBanners: [
    {
      bannerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Banner",
        required: true,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
    },
  ],
}, { timestamps: true });

const PopupSetting = mongoose.model("PopupSetting", popupSettingSchema);

module.exports = PopupSetting;
