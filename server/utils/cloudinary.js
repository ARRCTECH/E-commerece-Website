// utils/cloudinary.js

const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // ensure .env is loaded

// Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, transformations = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: `ksaunibliss/${folder}`,
        quality: "auto",
        fetch_format: "auto",
        ...transformations, // allows dynamic resizing, cropping etc.
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// Delete by public_id utility (for product updates/deletes)
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
