import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

function Sidebar() {
    const navigate = useNavigate();
    const { role, refreshToken, logoutUser } = useAuth();

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
            : "User";

    return (
        <aside className="sidebar">

            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">L</div>
                <span>LeadFlow</span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/leads"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <Users size={20} />
                    <span>Leads</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>

            </nav>

            {/* Bottom */}
            <div className="sidebar-bottom">

                <div className="sidebar-role">
                    <span>Signed in as</span>
                    <strong>{roleName}</strong>
                </div>

                <button
                    className="nav-item logout-btn"
                    onClick={handleLogout}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

            </div>
        </aside>
    );
}

export default Sidebar;