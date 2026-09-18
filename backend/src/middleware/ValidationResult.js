const { validationResult } = require("express-validator")

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const details = errors.array().map((error) => ({
            field: error.path,
            location: error.location,
            message: error.msg
        }));

        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Request Validation failed",
                details
            }
        });
    }
    next();
};

module.exports = validateRequest;