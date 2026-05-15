const KsauniTshirt = require("../models/Ksaunitshirt")
const { uploadToCloudinary } = require("../utils/cloudinary")

// Get all factory sales
exports.getAllKsauniTshirts = async (req, res) => {
  try {
    const tshirts = await KsauniTshirt.find().sort({ order: 1, createdAt: -1 })
    res.status(200).json({ success: true, data: tshirts })
  } catch (error) {
    console.error("Get all factory sales error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch factory sales" })
  }
}

// Create factory sale
exports.createKsauniTshirt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "T-shirt image is required" })
    }
    let result
    try {
      result = await uploadToCloudinary(req.file.buffer, "ksauni-tshirts")
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return res.status(500).json({
        success: false,
        message: "Error uploading and saving image.",
        error: uploadError.message,
      })
    }

    const tshirt = new KsauniTshirt({
      image: {
        url: result.secure_url,
        alt: req.body.alt || "factory sale",
      },
      order: Number.parseInt(req.body.order) || 0,
      isActive: req.body.isActive === "true" || req.body.isActive === true,
      createdBy: req.user?.userId || "system",
    })

    await tshirt.save()

    res.status(201).json({
      success: true,
      message: "factory sale created successfully",
      tshirt,
    })
  } catch (error) {
    console.error("Create factory sale error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create factory sale",
      error: error.message,
    })
  }
}

// Update factory sale
exports.updateKsauniTshirt = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = {
      order: Number.parseInt(req.body.order) || 0,
      isActive: req.body.isActive === "true" || req.body.isActive === true,
    }

    const tshirt = await KsauniTshirt.findById(id)
    if (!tshirt) {
      return res.status(404).json({ success: false, message: "factory sale not found" })
    }

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, "ksauni-tshirts")
        updateData.image = {
          url: result.secure_url,
          alt: req.body.alt || tshirt.image.alt,
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError)
        return res.status(500).json({
          success: false,
          message: "Error uploading and saving image.",
          error: uploadError.message,
        })
      }
    } else if (req.body.alt) {
      updateData.image = {
        url: tshirt.image.url,
        alt: req.body.alt,
      }
    }

    const updatedTshirt = await KsauniTshirt.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      message: "factory sale updated successfully",
      tshirt: updatedTshirt,
    })
  } catch (error) {
    console.error("Update factory sale error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update factory sale",
      error: error.message,
    })
  }
}

// Delete factory sale
exports.deleteKsauniTshirt = async (req, res) => {
  try {
    const { id } = req.params

    const tshirt = await KsauniTshirt.findById(id)
    if (!tshirt) {
      return res.status(404).json({ success: false, message: "factory sale not found" })
    }

    await KsauniTshirt.findByIdAndDelete(id)

    res.status(200).json({ success: true, message: "factory sale deleted successfully" })
  } catch (error) {
    console.error("Delete factory sale error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete factory sale",
      error: error.message,
    })
  }
}
