import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
    });

    return response.data;
};

export const logout = async (refreshToken) => {
    const response = await axios.post(`${API_URL}/auth/logout`, {
        refreshToken,
    });

    return response.data;
};

export const refreshAccessToken = async (refreshToken) => {
    const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {
            refreshToken,
        }
    );

    return response.data;
};