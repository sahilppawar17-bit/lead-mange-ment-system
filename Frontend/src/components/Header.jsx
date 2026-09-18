import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

function Header() {
    const navigate = useNavigate();
    const { refreshToken, logoutUser } = useAuth();

    const handleLogout = async () => {
        try {
            // Tell backend to invalidate the refresh token
            if (refreshToken) {
                await logout(refreshToken);
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            // Clear tokens from frontend even if backend request fails
            logoutUser();
            navigate("/");
        }
    };

    return (
        <header className="header">
            <div>
                <h1>Dashboard</h1>
                <p>
                    Welcome back! Here's What's Happening with your leads.
                </p>
            </div>

            <div className="header-right">
                <button className="notification-btn">
                    <Bell size={20} />
                </button>

                <div className="user-profile">
                    <div className="avatar">SP</div>

                    <div className="user-info">
                        <strong>Sahil Pawar</strong>
                        <span>Team Lead</span>
                    </div>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </header>
    );
}

export default Header;