import axios from "axios";
import { refreshAccessToken } from "./authService";

const api = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach access token to every request
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Automatically refresh expired access token
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 once
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken =
                localStorage.getItem("refreshToken");

            if (!refreshToken) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/";
                return Promise.reject(error);
            }

            try {
                const response =
                    await refreshAccessToken(refreshToken);

                const newAccessToken =
                    response.data?.accessToken;

                if (!newAccessToken) {
                    throw new Error(
                        "New access token was not returned."
                    );
                }

                // Save new access token
                localStorage.setItem(
                    "accessToken",
                    newAccessToken
                );

                // Update failed request
                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                // Retry original request
                return api(originalRequest);

            } catch (refreshError) {
                console.error(
                    "Token refresh failed:",
                    refreshError
                );

                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;