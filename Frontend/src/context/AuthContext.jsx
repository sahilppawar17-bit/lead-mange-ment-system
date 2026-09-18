import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Get information stored inside JWT payload
const getTokenPayload = (token) => {
    try {
        if (!token) {
            return null;
        }

        const payload = token.split(".")[1];

        return JSON.parse(
            atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem("accessToken")
    );

    const [refreshToken, setRefreshToken] = useState(
        localStorage.getItem("refreshToken")
    );

    const [role, setRole] = useState(() => {
        const token = localStorage.getItem("accessToken");
        const payload = getTokenPayload(token);

        return payload?.role || null;
    });

    const loginUser = (tokens) => {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);

        // Get role from JWT
        const payload = getTokenPayload(tokens.accessToken);

        setRole(payload?.role || null);

        console.log("Logged in role:", payload?.role);
    };

    const logoutUser = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        setAccessToken(null);
        setRefreshToken(null);
        setRole(null);
    };

    const isAuthenticated = !!accessToken;

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                refreshToken,
                role,
                isAuthenticated,
                loginUser,
                logoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}