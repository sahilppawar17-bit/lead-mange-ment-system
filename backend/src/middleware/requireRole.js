const { AuthError, AppError } = require("../errors/AppError");

const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {

        if(!req.user){
            return next(
                new AppError(
                    "Authentication required",
                    401,
                    "AUTH_ERROR"
                )
            );
        }

        if(!allowedRoles.includes(req.user.role)){
            return next(
                new AppError(
                    "You do not have permissions to access this resource",
                    403,
                    "FORBIDDEN"
                )
            );
        }

        next();
    };
};

module.exports = requireRole;