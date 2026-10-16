const fs = require("fs/promises");

const {
  uploadFile,
  getFileForUser,
} = require("../services/fileService");

const { TEMP_DIR } = require("../middleware/fileUpload");

async function createFile(req, res, next) {
  console.log("DEBUG req.file:", req.file);
  console.log("DEBUG req.body:", req.body);

  try {
    const result = await uploadFile(
      req.file,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
}
async function downloadFile(req, res, next) {
  try {
    const file = await getFileForUser(
      req.params.fileId,
      req.user
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Length", String(file.size_bytes));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="download"`
    );

    return res.sendFile(file.diskPath, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createFile,
  downloadFile,
};