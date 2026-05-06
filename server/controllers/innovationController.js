const Innovation = require("../models/Innovation");
const { uploadToCloudinary } = require("../utils/cloudinary");

// Get all innovations
exports.getAllInnovations = async (req, res) => {
  try {
    const innovations = await Innovation.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.status(200).json({ innovations });
  } catch (error) {
    console.error("Get all innovations error:", error);
    res.status(500).json({ message: "Failed to fetch innovations" });
  }
};

// Create new innovation
exports.createInnovation = async (req, res) => {
  try {
    const { title, description, category, tags, priority, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Innovation image is required" });
    }

    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "innovations");

    const innovation = new Innovation({
      title,
      image: {
        url: result.secure_url,
        alt: "Innovation Image",
      },
      description,
      category,
      tags: parsedTags,
      priority: priority || "Medium",
      status: status || "Draft",
      isActive: true,
      createdBy: req.user.userId,
    });

    await innovation.save();

    res.status(201).json({
      message: "Innovation created successfully",
      innovation,
    });
  } catch (error) {
    console.error("Create innovation error:", error);
    res.status(500).json({ message: "Failed to create innovation" });
  }
};

// Update innovation
exports.updateInnovation = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, isActive } = req.body;

    const innovation = await Innovation.findById(id);
    if (!innovation) {
      return res.status(404).json({ message: "Innovation not found" });
    }

    // Handle image upload if new image provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "innovations");
      req.body.image = {
        url: result.secure_url,
        alt: "Innovation Image",
      };
    }

    const updatedInnovation = await Innovation.findByIdAndUpdate(
      id,
      { description, isActive, ...(req.file && { image: req.body.image }) },
      { new: true, runValidators: true }
    ).populate("createdBy", "name role");

    res.status(200).json({
      message: "Innovation updated successfully",
      innovation: updatedInnovation,
    });
  } catch (error) {
    console.error("Update innovation error:", error);
    res.status(500).json({ message: "Failed to update innovation" });
  }
};

// Delete innovation
exports.deleteInnovation = async (req, res) => {
  try {
    const { id } = req.params;

    const innovation = await Innovation.findById(id);
    if (!innovation) {
      return res.status(404).json({ message: "Innovation not found" });
    }

    await Innovation.findByIdAndDelete(id);

    res.status(200).json({ message: "Innovation deleted successfully" });
  } catch (error) {
    console.error("Delete innovation error:", error);
    res.status(500).json({ message: "Failed to delete innovation" });
  }
};

// Get active innovations
exports.getActiveInnovations = async (req, res) => {
  try {
    const innovations = await Innovation.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.status(200).json({ innovations });
  } catch (error) {
    console.error("Get active innovations error:", error);
    res.status(500).json({ message: "Failed to fetch active innovations" });
  }
};