import { useEffect, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getLeadById } from "../services/leadService";

function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);

        const response = await getLeadById(id);

        console.log("Lead details:", response);

        setLead(response.data);
      } catch (err) {
        console.error("Failed to load lead:", err);

        setError(
          err.response?.data?.error?.message ||
            "Failed to load lead."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  if (loading) {
    return (
      <div className="table-message">
        Loading lead...
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-message error-message">
        {error}
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="table-message">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="lead-details-page">

      <div className="details-header">

        <div>
          <button
            className="back-button"
            onClick={() => navigate("/leads")}
          >
            <ArrowLeft size={18} />
            Back to Leads
          </button>

          <h2>Lead Details</h2>
          <p>View complete information about this lead.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate(`/leads/${id}/edit`)}
        >
          <Pencil size={18} />
          Edit Lead
        </button>

      </div>

      <div className="details-card">

        <div className="details-profile">

          <div className="details-avatar">
            {lead.full_name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3>{lead.full_name}</h3>

            <span
              className={`status-badge status-${lead.lead_status?.toLowerCase()}`}
            >
              {lead.lead_status}
            </span>
          </div>

        </div>

        <div className="details-grid">

          <div className="detail-item">
            <span>Full Name</span>
            <strong>{lead.full_name || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Age</span>
            <strong>{lead.age || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Mobile Number</span>
            <strong>{lead.phone_mobile || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Country Code</span>
            <strong>{lead.country_code || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Lead Status</span>
            <strong>{lead.lead_status || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Date Entered</span>
            <strong>
              {lead.date_entered
                ? new Date(
                    lead.date_entered
                  ).toLocaleString()
                : "-"}
            </strong>
          </div>

          <div className="detail-item">
            <span>Lead ID</span>
            <strong>{lead.id}</strong>
          </div>

        </div>

      </div>

    </div>
  );
}

export default LeadDetails;