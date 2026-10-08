// Configure Multer to safely receive CSV/XLSX import files
// and temporarily store them on disk for background processing.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 1. Define where uploaded import files will be stored

const uploadDirectory = path.join(
    process.cwd(),
    "storage",
    "imports"
);

// 2. Make sure the upload directory exists

fs.mkdirSync(uploadDirectory, {
    recursive: true
});

// 3. Configure how Multer stores uploaded files

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        // Generate a unique filename so two uploads with the
        // same original filename never overwrite each other.

        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

        cb(null, uniqueName);
    }
});


// 4. Restrict accepted file types
const fileFilter = (req, file, cb) => {

    const extension = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [
        ".csv",
        ".xlsx"
    ];

    if (!allowedExtensions.includes(extension)) {

        return cb(
            new Error("Only CSV and XLSX files are allowed.")
        );
    }

    cb(null, true);
};


// 5. Create the Multer upload middleware
const upload = multer({

    storage,

    fileFilter,

    limits: {
        // Temporary safety limit.
        // We will revisit the exact limit when we implement
        // production-grade large-file handling.
        fileSize: 250 * 1024 * 1024
    }
});


module.exports = {
    upload
};