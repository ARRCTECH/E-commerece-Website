// middleware/upload.js

const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  }
  // Allow videos
  else if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  }
  else {
    cb(new Error("Only image or video files are allowed!"), false);
  }
};

// ✅ Create multer instance with all methods
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit
  },
});

// ✅ Attach productUploadFields as a property
upload.productUploadFields = upload.fields([
  { name: 'commonImages', maxCount: 20 },
  { name: 'videos', maxCount: 10 },
    { name: 'colorImages', maxCount: 100 },   // ← YEH LINE IMPORTANT HAI

]);

// ✅ Export upload directly (keeps all original methods)
module.exports = upload;