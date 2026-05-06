const Banner = require("../models/Banner")
const { uploadToCloudinary } = require("../utils/cloudinary")

// Get hero banners
// Get hero banners
exports.getHeroBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      type: "hero",
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: new Date() } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }] },
      ],
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate("createdBy", "name")


    res.status(200).json({ banners })
  } catch (error) {
    console.error("Get hero banners error:", error)
    res.status(500).json({ message: "Failed to fetch hero banners" })
  }
}


// Get promo banners
exports.getPromoBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      type: "promo",
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: new Date() } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }] },
      ],
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate("createdBy", "name")

      

    res.status(200).json({ banners })
  } catch (error) {
    console.error("Get promo banners error:", error)
    res.status(500).json({ message: "Failed to fetch promo banners" })
  }
}

// Create banner (Admin/Digital Marketer)
exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      bannerLink,
      type,
      sortOrder,
      startDate,
      endDate,
      targetAudience,
    } = req.body

    if (!req.file) {
      return res.status(400).json({ message: "Banner image is required" })
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "banners")

    const banner = new Banner({
      title,
      subtitle,
      description,
      image: {
        url: result.secure_url,
        alt: title,
      },
      buttonText,
      buttonLink,
      bannerLink,
      type,
      sortOrder: sortOrder || 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      targetAudience: targetAudience || "all",
      createdBy: req.user.userId,
    })

    await banner.save()

    res.status(201).json({
      message: "Banner created successfully",
      banner,
    })
  } catch (error) {
    console.error("Create banner error:", error)
    res.status(500).json({ message: "Failed to create banner" })
  }
}

// Update banner (Admin/Digital Marketer)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const banner = await Banner.findById(id)
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" })
    }
    // Handle image upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "banners")
      updateData.image = {
        url: result.secure_url,
        alt: updateData.title || banner.title,
      }
    }

    // Parse dates
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
      "createdBy",
      "name",
    )

    res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    })
  } catch (error) {
    console.error("Update banner error:", error)
    res.status(500).json({ message: "Failed to update banner" })
  }
}

// Delete banner (Admin/Digital Marketer)
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params

    const banner = await Banner.findById(id)
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" })
    }

   

    await Banner.findByIdAndDelete(id)

    res.status(200).json({ message: "Banner deleted successfully" })
  } catch (error) {
    console.error("Delete banner error:", error)
    res.status(500).json({ message: "Failed to delete banner" })
  }
}

// Get all banners (Admin/Digital Marketer)
exports.getAllBanners = async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Digital marketers see only their banners
    if (req.user && req.user.role === "digitalMarketer") {
      query.createdBy = req.user.userId;
    }

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.status(200).json({ banners });
  } catch (error) {
    console.error("Get all banners error:", error);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
};
