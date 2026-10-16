
import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import api from "../services/api";

const pageStyle = {
  padding: "28px 32px",
  minHeight: "100%",
  background: "#f4f7fc",
  color: "#172554",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #dce5f1",
  borderRadius: "12px",
  padding: "28px 30px",
  marginBottom: "24px",
};

const buttonStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [uploads, setUploads] = useState([]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setMessage("");
    setMessageType("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions =
      /\.(csv|xlsx|png|jpe?g|pdf|docx?)$/i;

    if (!allowedExtensions.test(selectedFile.name)) {
      setFile(null);
      event.target.value = "";
      setMessage("Please select a supported file type.");
      setMessageType("error");
      return;
    }

    setFile(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setMessage("");
    setMessageType("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a file first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Uses the existing Axios API configuration.
      const response = await api.post("/files", formData);

      const data = response.data?.data ?? response.data;

      const uploadedFile = {
        fileId: data.fileId || data.id,
        originalName: data.originalName || file.name,
        type: data.type || file.type || "Unknown",
        size: data.size ?? file.size,
        createdAt: data.createdAt || new Date().toISOString(),
        url: data.url,
      };

      setUploads((previous) => [uploadedFile, ...previous]);

      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("File uploaded successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("File upload error:", error);

      setMessage(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          "File upload failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    if (!item.url) {
      setMessage(
        "The backend has not returned a file viewing URL."
      );
      setMessageType("error");
      return;
    }

    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "28px" }}>
          File Upload
        </h1>

        <p style={{ margin: 0, color: "#60718e", fontSize: "14px" }}>
          Upload and manage documents and images for your leads.
        </p>
      </div>

      <section style={cardStyle}>
        <form onSubmit={handleUpload}>
          <label
            htmlFor="task8-file-input"
            style={{
              minHeight: "260px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              border: "2px dashed #b8d4ff",
              borderRadius: "12px",
              background: "#f8fbff",
              cursor: "pointer",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            <Upload size={44} color="#2563eb" />

            <strong style={{ fontSize: "18px", overflowWrap: "anywhere" }}>
              {file ? file.name : "Select your file"}
            </strong>

            <span style={{ color: "#60718e", fontSize: "14px" }}>
              Supported formats: PNG, JPG, PDF, CSV, XLSX, DOC, DOCX
            </span>

            <input
              ref={fileInputRef}
              id="task8-file-input"
              type="file"
              accept=".csv,.xlsx,.png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{
                maxWidth: "100%",
                padding: "10px",
                border: "1px solid #dbe5f2",
                borderRadius: "8px",
                background: "#fff",
              }}
            />
          </label>

          {file && (
            <p style={{ color: "#475569", fontSize: "14px" }}>
              Selected: {file.name} ({formatSize(file.size)})
            </p>
          )}

          {message && (
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "13px 16px",
                marginTop: "18px",
                borderRadius: "8px",
                color: messageType === "success" ? "#166534" : "#991b1b",
                background: messageType === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${
                  messageType === "success" ? "#86efac" : "#fecaca"
                }`,
              }}
            >
              {messageType === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}

              {message}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "26px",
              paddingTop: "22px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <span style={{ color: "#60718e", fontSize: "13px" }}>
              File size limits are enforced by the backend.
            </span>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={handleClear}
                disabled={!file || loading}
                style={{
                  ...buttonStyle,
                  background: "#fff",
                  color: "#172554",
                  border: "1px solid #cbd5e1",
                  opacity: !file || loading ? 0.55 : 1,
                }}
              >
                <X size={16} style={{ verticalAlign: "middle" }} /> Clear
              </button>

              <button
                type="submit"
                disabled={!file || loading}
                style={{
                  ...buttonStyle,
                  background: "#2563eb",
                  color: "#fff",
                  border: "1px solid #2563eb",
                  opacity: !file || loading ? 0.55 : 1,
                }}
              >
                <Upload size={16} style={{ verticalAlign: "middle" }} />{" "}
                {loading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: "0 0 22px", fontSize: "21px" }}>
          Recent Uploads
        </h2>

        {uploads.length === 0 ? (
          <p
            style={{
              padding: "28px 12px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: "8px",
            }}
          >
            Your uploaded files will appear here.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              <thead style={{ background: "#f8fafc", color: "#526987" }}>
                <tr>
                  {["File Name", "File Type", "Size", "Uploaded At", "Action"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "15px 12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {uploads.map((item, index) => (
                  <tr key={item.fileId || `${item.originalName}-${index}`}>
                    <td style={{ padding: "18px 12px" }}>
                      <FileText
                        size={17}
                        style={{ verticalAlign: "middle", marginRight: "8px" }}
                      />
                      {item.originalName}
                    </td>

                    <td style={{ padding: "18px 12px" }}>{item.type}</td>
                    <td style={{ padding: "18px 12px" }}>
                      {formatSize(item.size)}
                    </td>
                    <td style={{ padding: "18px 12px" }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    <td style={{ padding: "18px 12px" }}>
                      <button
                        type="button"
                        onClick={() => handleView(item)}
                        style={{
                          border: 0,
                          background: "transparent",
                          color: "#2563eb",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={16} style={{ verticalAlign: "middle" }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default FileUpload;
