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