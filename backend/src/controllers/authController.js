const authService = require("../services/authService");

const login = async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(
        email,
        password
    );

    res.status(200).json({
        success: true,
        data: result
    });
};

const refresh = async(req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(
        refreshToken
    );

    res.status(200).json({
        success: true,
        data: result
    });
};

const logout = async(req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.logout(
        refreshToken
    );

    res.status(200).json({
        success: true,
        data: result
    })
}

module.exports = {
    login,
    refresh,
    logout
};