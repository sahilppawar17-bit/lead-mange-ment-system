class AppError extends Error {
    constructor(
        message,
        statusCode = 500,
        code = "INTERNAL_SERVER_ERROR",
        details = []
    ) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

class ValidationError extends AppError {
    constructor(message = "Validation failed", details = []) {
        super(message, 400, "VALIDATION_ERROR",details);
        this.name = "ValidationError";
    }
}

class ConflictError extends AppError {
    constructor(message = "Resource already exists",details=[]){
        super(message, 409, "CONFLICT", details);
        this.name = "ConflictError";
    }
}

class AuthError extends AppError {
    constructor(
        message = "Authentication failed",
        statusCode = 401
    ) {
        super(message, statusCode, "AUTH_ERROR");
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    ConflictError,
    AuthError
};