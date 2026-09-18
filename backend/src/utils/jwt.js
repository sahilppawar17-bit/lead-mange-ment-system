const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const REFRESH_EXPPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if(!ACCESS_SECRET){
    throw new Error("JWT_ACCESS_SECRET is not configured");
}

if(!REFRESH_SECRET){
    throw new Error("JWT_REFRESH_SECRET is not configured");
}

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            teamId: user.team_id
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN
        }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user.id
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPPIRES_IN
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_SECRET);
}

const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
}