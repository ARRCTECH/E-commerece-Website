// utils/cloudinary.js

const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Readable } = require('stream');
require("dotenv").config();

// Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary (for images)
const uploadToCloudinary = (buffer, folder, transformations = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: `FactorySale/${folder}`,
        quality: "auto",
        fetch_format: "auto",
        ...transformations,
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

// ✅ COMPLETELY FIXED: Video upload without temp file
const uploadToCloudinaryVideo = async (buffer, folder, extraOptions = {}) => {
  return new Promise((resolve, reject) => {
    // Create a readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: `FactorySale/${folder}`,
        quality: "auto",
        fetch_format: "auto",
        timeout: 180000,
        eager_async: true,
        ...extraOptions,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary video upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    readableStream.pipe(uploadStream);
  });
};

// Video upload with retry
const uploadToCloudinaryVideoWithRetry = async (buffer, folder, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📹 Video upload attempt ${attempt}/${maxRetries}...`);
      const result = await uploadToCloudinaryVideo(buffer, folder);
      console.log(`✅ Video uploaded successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`❌ Video upload attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Delete function
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
      } else {
        resolve(result);
        console.log(`Cloudinary delete result for ${publicId}:`, result);
      }
    });
  });
};

module.exports = { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  uploadToCloudinaryVideo, 
  uploadToCloudinaryVideoWithRetry 
};