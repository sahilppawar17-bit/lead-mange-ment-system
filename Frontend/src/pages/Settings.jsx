import { User, ShieldCheck, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

function Settings() {
    const navigate = useNavigate();

    const {
        accessToken,
        refreshToken,
        role,
        logoutUser,
    } = useAuth();

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await logout(refreshToken);
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            logoutUser();
            navigate("/");
        }
    };

    const roleName =
        role === "team_lead"
            ? "Team Lead"
            : role === "user"
            ? "User"
            : "Unknown";

    return (
        <div className="settings-page">

            <div className="page-heading">
                <div>
                    <h2>Settings</h2>
                    <p>Manage your account and authentication settings.</p>
                </div>
            </div>

            {/* Account */}
            <div className="settings-card">

                <div className="settings-card-header">
                    <div className="settings-icon">
                        <User size={20} />
                    </div>

                    <div>
                        <h3>Account Information</h3>
                        <p>Your account details.</p>
                    </div>
                </div>

                <div className="settings-row">
                    <span>Name</span>
                    <strong>Sahil Pawar</strong>
                </div>

                <div className="settings-row">
                    <span>Email</span>
                    <strong>
                        {role === "team_lead"
                            ? "lead@test.com"
                            : "user@test.com"}
                    </strong>
                </div>

                <div className="settings-row">
                    <span>Role</span>
                    <strong>{roleName}</strong>
                </div>

            </div>

            {/* Authentication */}
            <div className="settings-card">

                <div className="settings-card-header">
                    <div className="settings-icon">
                        <ShieldCheck size={20} />
                    </div>

                    <div>
                        <h3>Authentication</h3>
                        <p>Current authentication status.</p>
                    </div>
                </div>

                <div className="settings-row">
                    <span>Authentication Method</span>
                    <strong>JWT Authentication</strong>
                </div>

                <div className="settings-row">
                    <span>Access Token</span>

                    <span className="token-status">
                        {accessToken ? "Active" : "Inactive"}
                    </span>
                </div>

            </div>

            {/* Logout */}
            <div className="settings-card">

                <div className="settings-card-header">
                    <div className="settings-icon">
                        <LogOut size={20} />
                    </div>

                    <div>
                        <h3>Session</h3>
                        <p>Sign out from your current session.</p>
                    </div>
                </div>

                <button
                    className="logout-settings-button"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    Logout
                </button>

            </div>

        </div>
    );
}

export default Settings;