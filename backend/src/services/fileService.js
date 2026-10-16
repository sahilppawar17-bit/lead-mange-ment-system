const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const yauzl = require("yauzl");
const fsSync = require("fs");
const pool = require("../db");
const { TEMP_DIR } = require("../middleware/fileUpload");

const BASE_DIR = path.resolve(
  process.env.PRIVATE_UPLOAD_DIR || "private-uploads"
);

const STORAGE_DIR = path.join(BASE_DIR, "files");

const MB = 1024 * 1024;

const ALLOWED = {
  ".png": {
    type: "image/png",
    max: 5 * MB,
  },
  ".jpg": {
    type: "image/jpeg",
    max: 5 * MB,
  },
  ".jpeg": {
    type: "image/jpeg",
    max: 5 * MB,
  },
  ".pdf": {
    type: "application/pdf",
    max: 20 * MB,
  },
  ".doc": {
    type: "application/msword",
    max: 20 * MB,
  },
  ".xlsx": {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    max: 50 * MB,
  },
  ".csv": {
    type: "text/csv",
    max: 50 * MB,
  },
};

class FileServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function detectBinaryType(filePath) {
  const { fileTypeFromFile } = await import("file-type");
  return fileTypeFromFile(filePath);
}

async function isValidXlsx(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(
      filePath,
      { lazyEntries: true, autoClose: true },
      (error, zipFile) => {
        if (error) return reject(error);

        const required = new Set([
          "[Content_Types].xml",
          "xl/workbook.xml",
        ]);

        zipFile.on("entry", (entry) => {
          required.delete(entry.fileName);

          if (required.size === 0) {
            zipFile.close();
            resolve(true);
          } else {
            zipFile.readEntry();
          }
        });

        zipFile.on("end", () => {
          resolve(required.size === 0);
        });

        zipFile.on("error", reject);
        zipFile.readEntry();
      }
    );
  });
}

async function isValidCsv(filePath) {
  const handle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    if (bytesRead === 0) return false;

    const sample = buffer.subarray(0, bytesRead);

    // CSV is text, not a format with a unique magic signature.
    if (sample.includes(0)) return false;

    const text = sample.toString("utf8");

    // Reject binary-looking content and obvious invalid UTF-8.
    if (text.includes("\uFFFD")) return false;

    return true;
  } finally {
    await handle.close();
  }
}

async function validateContent(filePath, extension) {
  const expected = ALLOWED[extension];

  if (!expected) {
    throw new FileServiceError(
      "Unsupported file extension",
      415
    );
  }

  if (extension === ".csv") {
    if (!(await isValidCsv(filePath))) {
      throw new FileServiceError(
        "File content is not valid CSV text",
        415
      );
    }

    return expected.type;
  }

  if (extension === ".doc") {
    const handle = await fs.open(filePath, "r");

    try {
      const header = Buffer.alloc(8);
      const { bytesRead } = await handle.read(
        header,
        0,
        8,
        0
      );

      const oleSignature = Buffer.from([
        0xd0, 0xcf, 0x11, 0xe0,
        0xa1, 0xb1, 0x1a, 0xe1,
      ]);

      if (
        bytesRead < 8 ||
        !header.equals(oleSignature)
      ) {
        throw new FileServiceError(
          "File signature does not match DOC",
          415
        );
      }
    } finally {
      await handle.close();
    }

    return expected.type;
  }

  if (extension === ".xlsx") {
    const handle = await fs.open(filePath, "r");

    try {
      const header = Buffer.alloc(4);
      const { bytesRead } = await handle.read(
        header,
        0,
        4,
        0
      );

      if (
        bytesRead < 4 ||
        header[0] !== 0x50 ||
        header[1] !== 0x4b
      ) {
        throw new FileServiceError(
          "File signature does not match XLSX",
          415
        );
      }
    } finally {
      await handle.close();
    }

    if (!(await isValidXlsx(filePath))) {
      throw new FileServiceError(
        "ZIP file does not contain a valid XLSX structure",
        415
      );
    }

    return expected.type;
  }

  const detected = await detectBinaryType(filePath);

  if (!detected || detected.mime !== expected.type) {
    throw new FileServiceError(
      "File signature does not match its extension",
      415
    );
  }

  return detected.mime;
}

async function uploadFile(file, userId) {
  if (!file) {
    throw new FileServiceError(
      "Select a file to upload",
      400
    );
  }

  await fs.mkdir(STORAGE_DIR, { recursive: true });

  const extension = path.extname(file.originalname).toLowerCase();
  const config = ALLOWED[extension];

  if (!config) {
    throw new FileServiceError(
      "Unsupported file type",
      415
    );
  }

  if (file.size > config.max) {
    throw new FileServiceError(
      "File exceeds the maximum size for its type",
      413
    );
  }

  let finalPath;

  try {
    const mimeType = await validateContent(
      file.path,
      extension
    );

    const fileId = crypto.randomUUID();
    const storageKey = crypto.randomUUID();
    finalPath = path.join(STORAGE_DIR, storageKey);

    // Exclusive creation: never overwrite an existing file.
    await fs.copyFile(
      file.path,
      finalPath,
      fsSync.constants.COPYFILE_EXCL
    );

    try {
      await pool.query(
        `INSERT INTO uploaded_files
          (file_id, storage_key, original_name,
           mime_type, size_bytes, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          fileId,
          storageKey,
          path.basename(file.originalname).slice(0, 255),
          mimeType,
          file.size,
          userId,
        ]
      );
    } catch (error) {
      await fs.unlink(finalPath).catch(() => {});
      throw error;
    }

    return {
      fileId,
      url: `/api/files/${fileId}`,
      type: mimeType,
      size: file.size,
    };
  } finally {
    // Remove temporary data whether validation succeeds or fails.
    await fs.unlink(file.path).catch(() => {});
  }
}

async function getFileForUser(fileId, user) {
  const result = await pool.query(
    `SELECT file_id, storage_key, original_name,
            mime_type, size_bytes, uploaded_by
     FROM uploaded_files
     WHERE file_id = $1`,
    [fileId]
  );

  if (result.rowCount === 0) {
    throw new FileServiceError("File not found", 404);
  }

  const record = result.rows[0];

  // Adjust this rule to your existing RBAC policy.
  const isAdmin = user.role === "admin";

  if (
    !isAdmin &&
    String(record.uploaded_by) !== String(user.userId)
  ) {
    // 404 avoids revealing that another user's file exists.
    throw new FileServiceError("File not found", 404);
  }

  return {
    ...record,
    diskPath: path.join(STORAGE_DIR, record.storage_key),
  };
}

module.exports = {
  uploadFile,
  getFileForUser,
  FileServiceError,
};