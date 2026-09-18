import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createLead } from "../services/leadService";

function AddLead() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    phone_mobile: "",
    country_code: "",
    lead_status: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      await createLead({
        ...formData,
        age: formData.age ? Number(formData.age) : null,
      });

      navigate("/leads");
    } catch (err) {
      console.error("Create lead error:", err);

      setError(
        err.response?.data?.error?.message ||
          "Failed to create lead."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">

      <div className="form-page-header">

        <div>
          <button
            className="back-button"
            onClick={() => navigate("/leads")}
          >
            <ArrowLeft size={18} />
            Back to Leads
          </button>

          <h2>Add Lead</h2>
          <p>Create a new lead in the system.</p>
        </div>

      </div>

      <div className="lead-form-card">

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            {/* Full Name */}

            <div className="form-field">
              <label>
                Full Name <span>*</span>
              </label>

              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Age */}

            <div className="form-field">
              <label>Age</label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
                min="1"
              />
            </div>

            {/* Phone */}

            <div className="form-field">
              <label>Mobile Number</label>

              <input
                type="text"
                name="phone_mobile"
                value={formData.phone_mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
              />
            </div>

            {/* Country */}

            <div className="form-field">
              <label>Country Code</label>

              <input
                type="text"
                name="country_code"
                value={formData.country_code}
                onChange={handleChange}
                placeholder="Example: IN"
              />
            </div>

            {/* Status */}

            <div className="form-field">
              <label>Lead Status</label>

              <select
                name="lead_status"
                value={formData.lead_status}
                onChange={handleChange}
              >
                <option value="">Select status</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/leads")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              <Save size={18} />

              {loading ? "Saving..." : "Save Lead"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddLead;