const { AppError } = require("../errors/AppError");

const errorHandler = (err, req, res, next) => {

    // Server error
    console.error("ERROR:", {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl
    });

    // Application Error
    if(err instanceof AppError){
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details && err.details.length > 0 
                    ? { details: err.details}
                    : {})
            }
        });
    }

    // PostgreSQL errors
    if(err.code === "23505"){
        return res.status(409).json({
            success: false,
            error: {
                code: "CONFLICT",
                message: "A record with the same value already exists"
            }
        });
    }
    // Multer upload errors
if (err instanceof require("multer").MulterError) {
  const tooLarge = err.code === "LIMIT_FILE_SIZE";

  return res.status(tooLarge ? 413 : 400).json({
    success: false,
    error: {
      code: tooLarge ? "FILE_TOO_LARGE" : err.code,
      message: tooLarge
        ? "Uploaded file exceeds the maximum allowed size"
        : "Invalid file upload",
    },
  });
}

// File validation errors
if (err.statusCode === 413 || err.statusCode === 415) {
  return res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.statusCode === 413
        ? "FILE_TOO_LARGE"
        : "UNSUPPORTED_FILE_TYPE",
      message: err.message,
    },
  });
}

    // The response may already have timed out.
    if (res.headersSent) {
        return next(err);
    }

    // PostgreSQL statement timeout or explicit query cancellation.
    if (err.code === "57014") {
        res.set("Retry-After", "2");

        return res.status(503).json({
            success: false,
            error: {
                code: "DATABASE_QUERY_TIMEOUT",
                message: "The database is busy. Please retry."
            }
        });
    }

    // PostgreSQL connection limit reached.
    if (err.code === "53300") {
        res.set("Retry-After", "2");

        return res.status(503).json({
            success: false,
            error: {
                code: "DATABASE_CAPACITY_EXCEEDED",
                message: "The service is temporarily busy."
            }
        });
    }

    // Database startup or connection failures.
    if (
        err.code === "57P03" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT"
    ) {
        res.set("Retry-After", "2");

        return res.status(503).json({
            success: false,
            error: {
                code: "DATABASE_UNAVAILABLE",
                message: "The service is temporarily unavailable."
            }
        });
    }


    //Unexpected errors
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "INternal server error"
        }
    });

};

module.exports = errorHandler;