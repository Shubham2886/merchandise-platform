const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const uploadDir = path.join(__dirname, "..", "..", process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|svg|pdf/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new ApiError(400, "Only image or PDF files are allowed for design uploads."), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
});

// POST /upload - used for both product images (admin) and customer design/artwork uploads
router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json(new ApiResponse(201, { url }, "File uploaded"));
});

module.exports = router;
