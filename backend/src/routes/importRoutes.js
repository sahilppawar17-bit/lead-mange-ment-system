// Define API routes for large CSV/XLSX lead imports.

const express = require("express");

const router = express.Router();

const { createImport, getImportStatus , downloadImportErrors} = require("../controllers/importController");

const { upload } = require("../middleware/uploadMiddleware");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

// POST /api/imports

// upload.single("file") tells Multer that the multipart form
// field containing our uploaded file must be named "file".

router.post(
    "/",
    requireAuth,
    requireRole(["admin", "team_lead"]),
    upload.single("file"),
    createImport
);

// Return the current status and progress of an import job.

router.get(
    "/:jobId/status",
    requireAuth,
    requireRole(["admin", "team_lead"]),
    getImportStatus
);


// Download the CSV containing rejected import rows.

router.get(
    "/:jobId/errors",
    requireAuth,
    requireRole(["admin", "team_lead"]),
    downloadImportErrors
);

module.exports = router;