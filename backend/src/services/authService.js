const crypto = require("crypto");

const pool = require("../db");

const { comparePassword } = require("../utils/password");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require("../utils/jwt");

const { AuthError } = require("../errors/AppError");

const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

const login = async (email, password) => {
    const result = await pool.query(
        `
        Select
            id,
            email,
            password_hash,
            role,
            team_id
        from users
        where email = $1
        `,
        [email]
    );

    if(result.rows.length === 0){
        throw new AuthError("Invalid email or password");
    }
    const user = result.rows[0];

    const passwordValid = await comparePassword(
        password,
        user.password_hash
    );

    if(!passwordValid){
        throw new AuthError("Invalid email or password");
    }

    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);

    const refreshTokenHash = hashRefreshToken(refreshToken);

    await pool.query(
        `
        insert into refresh_tokens
            (
                user_id,
                token_hash,
                expires_at
            )
        values
            (
                $1,
                $2,
                NOW() + INTERVAL '7 days'
            )
        `,
        [
            user.id,
            refreshTokenHash
        ]
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60
    };
};

const refreshAccessToken = async(refreshToken) => {
    let decoded;

    try{
        decoded = verifyRefreshToken(refreshToken);
    }catch(error){
        throw new AuthError("Invalid or expired refresh token");
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const result = await pool.query(
        `
        select
            rt.id,
            rt.user_id,
            rt.expires_at,
            rt.revoked,
            u.id,
            u.email,
            u.role,
            u.team_id
        from refresh_tokens rt
        inner join users u
            on u.id = rt.user_id
        where rt.token_hash = $1
          and rt.user_id = $2
          and rt.revoked = false
        `,
        [
            tokenHash,
            decoded.userId
        ]
    );

    if(result.rows.length === 0){
        throw new AuthError("Invalid or revoked refresh token");
    }

    const user = result.rows[0];

    if(new Date(user.expires_at) <= new Date()){
        throw new AuthError("Refresh token has expired");
    }

    const accessToken = generateAccessToken({
        id: user.id,
        role: user.role,
        team_id: user.team_id
    });

    return {
        accessToken,
        expiresIn:15 * 60
    };
};

const logout = async(refreshToken) => {
    const tokenHash = hashRefreshToken(refreshToken);

    const result = await pool.query(
        `
        update refresh_tokens
        set revoked = true
        where token_hash = $1
          and revoked = false
        returning id
        `,
        [tokenHash]
    );

    if(result.rows.length === 0){
        throw new AuthError("Invalid or ready revoked refresh token");
    }

    return {
        message: "Logout successful"
    };
};

module.exports = {
    login,
    refreshAccessToken,
    logout,
    hashRefreshToken,
}