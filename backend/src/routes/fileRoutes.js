const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const {
  uploadSingleFile,
} = require("../middleware/fileUpload");

const {
  createFile,
  downloadFile,
} = require("../controllers/fileController");

const router = express.Router();

// POST /api/files
router.post(
  "/",
  requireAuth,
  uploadSingleFile,
  createFile
);

// GET /api/files/:fileId
router.get(
  "/:fileId",
  requireAuth,
  downloadFile
);

module.exports = router;