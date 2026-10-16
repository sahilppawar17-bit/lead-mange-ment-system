const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TEMP_DIR = path.resolve(
  process.env.PRIVATE_UPLOAD_DIR || "private-uploads",
  "tmp"
);

fs.mkdirSync(TEMP_DIR, { recursive: true });

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, TEMP_DIR);
  },

  filename: (_req, _file, callback) => {
    // Never use the original filename as the disk filename.
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 10,
    parts: 12,
    fieldNameSize: 100,
    fieldSize: 10 * 1024,
  },
});

module.exports = {
  uploadSingleFile: upload.single("file"),
  TEMP_DIR,
  MAX_UPLOAD_BYTES,
};