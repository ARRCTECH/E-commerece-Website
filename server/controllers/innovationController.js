const Innovation = require("../models/Innovation");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

exports.getAllInnovations = async (req, res) => {
  try {
    const innovations = await Innovation.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.status(200).json({ success: true, innovations });
  } catch (error) {
    console.error("Get all innovations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch innovations" });
  }
};

exports.createInnovation = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Innovation image is required" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "innovations");

    const innovation = new Innovation({
      title,
      image: {
        url: result.secure_url,
        alt: title,
      },
      category,
      isActive: true,
      createdBy: req.user.userId,
    });

    await innovation.save();

    const populatedInnovation = await Innovation.findById(innovation._id).populate("createdBy", "name role");

    res.status(201).json({
      success: true,
      message: "Innovation created successfully",
      innovation: populatedInnovation,
    });
  } catch (error) {
    console.error("Create innovation error:", error);
    res.status(500).json({ success: false, message: "Failed to create innovation" });
  }
};

exports.updateInnovation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, isActive } = req.body;

    const innovation = await Innovation.findById(id);
    if (!innovation) {
      return res.status(404).json({ success: false, message: "Innovation not found" });
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive === "true" || isActive === true;

    if (req.file) {
      if (innovation.image && innovation.image.url) {
        const publicId = innovation.image.url.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId, "innovations");
      }
      const result = await uploadToCloudinary(req.file.buffer, "innovations");
      updateData.image = {
        url: result.secure_url,
        alt: title || innovation.title,
      };
    }

    const updatedInnovation = await Innovation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name role");

    res.status(200).json({
      success: true,
      message: "Innovation updated successfully",
      innovation: updatedInnovation,
    });
  } catch (error) {
    console.error("Update innovation error:", error);
    res.status(500).json({ success: false, message: "Failed to update innovation" });
  }
};

exports.deleteInnovation = async (req, res) => {
  try {
    const { id } = req.params;

    const innovation = await Innovation.findById(id);
    if (!innovation) {
      return res.status(404).json({ success: false, message: "Innovation not found" });
    }

    if (innovation.image && innovation.image.url) {
      const publicId = innovation.image.url.split('/').pop().split('.')[0];
      await deleteFromCloudinary(publicId, "innovations");
    }

    await Innovation.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Innovation deleted successfully" });
  } catch (error) {
    console.error("Delete innovation error:", error);
    res.status(500).json({ success: false, message: "Failed to delete innovation" });
  }
};

// Get active innovations (Public)
exports.getActiveInnovations = async (req, res) => {
  try {
    const innovations = await Innovation.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.status(200).json({ success: true, innovations });
  } catch (error) {
    console.error("Get active innovations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active innovations" });
  }
};