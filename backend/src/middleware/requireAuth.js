const { AuthError } = require("../errors/AppError");
const { verifyAccessToken } = require("../utils/jwt");

const requireAuth = (req, res, next) => {
    const authorization = req.headers.authorization;

    if(!authorization){
        throw new AuthError("Authentication token is required");
    }

    if(!authorization.startsWith("Bearer ")){
        throw new AuthError("Invalid authorization format");
    }

    const token = authorization.substring(7).trim();

    if(!token){
        throw new AuthError("Authentication token is required");
    }

    try{
        const decoded = verifyAccessToken(token);

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            teamId: decoded.teamId
        };
        next();
    }catch(error){
        throw new AuthError("Invalid or expired authentication token");
    }
};

module.exports = requireAuth;