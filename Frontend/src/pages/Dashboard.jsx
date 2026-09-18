import { useEffect, useState } from "react";
import {
    Users,
    TrendingUp,
    AlertCircle,
    Clock,
    ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLeads } from "../services/leadService";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const { role } = useAuth();

    console.log("Current user role:", role);
    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getLeads({
                    limit: 50,
                    sort: "id",
                    order: "DESC",
                });

                console.log("Dashboard Leads API response:", response);

                setLeads(response.data?.rows || []);
            } catch (err) {
                console.error("Failed to fetch leads:", err);

                setError(
                    err.response?.data?.error?.message ||
                        "Failed to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    if (loading) {
        return (
            <div className="dashboard">
                <div className="page-heading">
                    <h2>Overview</h2>
                    <p>Track your lead management activity.</p>
                </div>

                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="page-heading">
                    <h2>Overview</h2>
                    <p>Track your lead management activity.</p>
                </div>

                <p className="error-message">{error}</p>
            </div>
        );
    }

    const totalLeads = leads.length;

    const highLeads = leads.filter(
        (lead) => lead.lead_status === "High"
    ).length;

    const mediumLeads = leads.filter(
        (lead) => lead.lead_status === "Medium"
    ).length;

    const lowLeads = leads.filter(
        (lead) => lead.lead_status === "Low"
    ).length;

    return (
        <div className="dashboard">

            {/* Heading */}
            <div className="page-heading">
                <div>
                    <h2>Overview</h2>
                    <p>
                        Track your lead management activity.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => navigate("/leads")}
                >
                    View All Leads
                    <ArrowRight size={17} />
                </button>
            </div>

            {/* Statistics */}
            <div className="stats-grid">

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Total Leads</span>
                        <div className="stat-icon">
                            <Users size={20} />
                        </div>
                    </div>

                    <strong>{totalLeads}</strong>

                    <small>
                        Leads currently loaded
                    </small>
                </div>

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>High Priority</span>
                        <div className="stat-icon">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <strong>{highLeads}</strong>

                    <small>
                        High priority leads
                    </small>
                </div>

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Medium Priority</span>
                        <div className="stat-icon">
                            <Clock size={20} />
                        </div>
                    </div>

                    <strong>{mediumLeads}</strong>

                    <small>
                        Medium priority leads
                    </small>
                </div>

                <div className="stat-card">
                    <div className="stat-card-top">
                        <span>Low Priority</span>
                        <div className="stat-icon">
                            <AlertCircle size={20} />
                        </div>
                    </div>

                    <strong>{lowLeads}</strong>

                    <small>
                        Low priority leads
                    </small>
                </div>

            </div>

            {/* Recent Leads */}
            <div className="dashboard-section">

                <div className="section-header">
                    <div>
                        <h3>Recent Leads</h3>
                        <p>
                            Recently added leads in the system.
                        </p>
                    </div>

                    <button
                        className="secondary-button"
                        onClick={() => navigate("/leads")}
                    >
                        View All
                    </button>
                </div>

                <div className="recent-leads-table">

                    {leads.length === 0 ? (
                        <div className="table-message">
                            No leads found.
                        </div>
                    ) : (
                        <table className="leads-table">

                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Country</th>
                                    <th>Status</th>
                                    <th>Date Entered</th>
                                </tr>
                            </thead>

                            <tbody>
                                {leads.slice(0, 5).map((lead) => (
                                    <tr key={lead.id}>

                                        <td>
                                            <div className="lead-name">
                                                {lead.full_name}
                                            </div>
                                        </td>

                                        <td>
                                            {lead.phone_mobile || "-"}
                                        </td>

                                        <td>
                                            {lead.country_code || "-"}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge status-${lead.lead_status?.toLowerCase()}`}
                                            >
                                                {lead.lead_status}
                                            </span>
                                        </td>

                                        <td>
                                            {lead.date_entered
                                                ? new Date(
                                                      lead.date_entered
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    )}

                </div>
            </div>

        </div>
    );
}

export default Dashboard;