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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit (videos can be large)
  },
});

module.exports = upload;
