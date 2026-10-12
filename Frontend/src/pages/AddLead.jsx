import { useState } from "react";
import { ArrowLeft, Save, UserPlus, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createLead } from "../services/leadService";
import BulkImport from "./BulkImport";

function AddLead() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("single");

 const [formData, setFormData] = useState({
  full_name: "",
  age: "",
  phone_mobile: "",
  country_code: "",
  loan_account_no: "",
  next_emi_date_dom: "",
  emi_amount: "",
  branch_code: "",
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

      {/* Purpose: Let users choose manual entry or bulk file import. */}
        <div className="lead-entry-tabs">
          {activeTab === "bulk" && <BulkImport />}
         <button
          type="button"
          className={`lead-entry-tab ${activeTab === "single" ? "active" : ""}`}
          onClick={() => setActiveTab("single")}
        >
          <UserPlus size={18} />
            Add Single Lead
          </button>

          <button
            type="button"
            className={`lead-entry-tab ${activeTab === "bulk" ? "active" : ""}`}
            onClick={() => setActiveTab("bulk")}
          >
          <FileSpreadsheet size={18} />
              Bulk Import (CSV / XLSX)
           </button>
        </div>

      {activeTab === "single" && (
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

            <div className="form-field">
  <label>
    Loan Account Number <span>*</span>
  </label>
  <input
    type="text"
    name="loan_account_no"
    value={formData.loan_account_no}
    onChange={handleChange}
    placeholder="Enter loan account number"
    required
    maxLength={100}
  />
</div>

{/* Next EMI Date */}
<div className="form-field">
  <label>
    Next EMI Date <span>*</span>
  </label>
  <input
    type="date"
    name="next_emi_date_dom"
    value={formData.next_emi_date_dom}
    onChange={handleChange}
    required
  />
</div>

{/* EMI Amount */}
<div className="form-field">
  <label>
    EMI Amount <span>*</span>
  </label>
  <input
    type="number"
    name="emi_amount"
    value={formData.emi_amount}
    onChange={handleChange}
    placeholder="Enter EMI amount"
    min="0"
    step="0.01"
    required
  />
</div>

{/* Branch Code */}
<div className="form-field">
  <label>
    Branch Code <span>*</span>
  </label>
  <select
    name="branch_code"
    value={formData.branch_code}
    onChange={handleChange}
    required
  >
    <option value="">Select branch</option>
    <option value="BLR01">BLR01</option>
    <option value="DEL01">DEL01</option>
    <option value="HYD01">HYD01</option>
    <option value="MUM01">MUM01</option>
    <option value="PUN01">PUN01</option>
  </select>
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
      )}
    </div>
  );
}

export default AddLead;