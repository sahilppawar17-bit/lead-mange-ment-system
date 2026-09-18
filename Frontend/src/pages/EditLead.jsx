import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getLeadById,
  updateLead,
} from "../services/leadService";

function EditLead() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    phone_mobile: "",
    country_code: "",
    lead_status: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await getLeadById(id);

        const lead = response.data;

        setFormData({
          full_name: lead.full_name || "",
          age: lead.age || "",
          phone_mobile: lead.phone_mobile || "",
          country_code: lead.country_code || "",
          lead_status: lead.lead_status || "",
        });
      } catch (err) {
        console.error(err);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await updateLead(id, {
        ...formData,
        age: formData.age
          ? Number(formData.age)
          : null,
      });

      navigate(`/leads/${id}`);
    } catch (err) {
      console.error("Update lead error:", err);

      setError(
        err.response?.data?.error?.message ||
          "Failed to update lead."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="table-message">
        Loading lead...
      </div>
    );
  }

  return (
    <div className="form-page">

      <div className="form-page-header">

        <button
          className="back-button"
          onClick={() => navigate(`/leads/${id}`)}
        >
          <ArrowLeft size={18} />
          Back to Lead
        </button>

        <h2>Edit Lead</h2>

        <p>
          Update the information for this lead.
        </p>

      </div>

      <div className="lead-form-card">

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-field">
              <label>
                Full Name <span>*</span>
              </label>

              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Age</label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="form-field">
              <label>Mobile Number</label>

              <input
                type="text"
                name="phone_mobile"
                value={formData.phone_mobile}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Country Code</label>

              <input
                type="text"
                name="country_code"
                value={formData.country_code}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Lead Status</label>

              <select
                name="lead_status"
                value={formData.lead_status}
                onChange={handleChange}
              >
                <option value="">
                  Select status
                </option>

                <option value="High">
                  High
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Low">
                  Low
                </option>
              </select>
            </div>

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/leads/${id}`)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditLead;