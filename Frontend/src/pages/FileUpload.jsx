
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

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;

    setMessage("");
    setMessageType("");

    if (
      selected &&
      !/\.(csv|xlsx|png|jpe?g|pdf|docx?)$/i.test(selected.name)
    ) {
      setFile(null);
      event.target.value = "";
      setMessage("Unsupported format. Please select a supported file.");
      setMessageType("error");
      return;
    }

    setFile(selected);
  };

  const handleClear = () => {
    setFile(null);
    setMessage("");
    setMessageType("");

    if (inputRef.current) {
      inputRef.current.value = "";
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Uses your existing API configuration.
      const response = await api.post("/files", formData);
      const data = response.data?.data ?? response.data;

      const uploaded = {
        fileId: data.fileId || data.id || `${Date.now()}`,
        originalName: data.originalName || file.name,
        type: data.type || file.type || "File",
        size: data.size ?? file.size,
        createdAt: data.createdAt || new Date().toISOString(),
        url: data.url,
      };

      setUploads((previous) => [uploaded, ...previous]);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setMessage("File uploaded successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("File upload error:", error);

      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Upload failed. Check your backend and try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

 

const handleView = async (item) => {
  try {
    const response = await api.get(
      `/files/${encodeURIComponent(item.fileId)}`,
      { responseType: "blob" }
    );

    const fileBlob = new Blob([response.data], {
      type: item.type || "application/pdf",
    });

    const fileUrl = URL.createObjectURL(fileBlob);
    window.open(fileUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
  } catch (error) {
    console.error("File view error:", error);

    setMessage(
      error.response?.status === 401
        ? "Your session has expired. Please log in again."
        : "Unable to open this file. Please try again."
    );
    setMessageType("error");
  }
};



  return (
    <div className="file-upload-page">
      <div className="file-upload-heading">
        <h2>File Upload</h2>
        <p>Upload and manage documents and images for your leads.</p>
      </div>

      <section className="file-upload-card">
        <form onSubmit={handleUpload}>
          <label htmlFor="leadflow-file" className="file-upload-area">
            <Upload size={42} />

            <h3>{file ? file.name : "Select your file"}</h3>

            <p>
              Supported formats: CSV, XLSX, PNG, JPG, PDF, DOC, DOCX
            </p>

            <input
              ref={inputRef}
              id="leadflow-file"
              type="file"
              accept=".csv,.xlsx,.png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Selected: {file.name} ({formatSize(file.size)})
            </p>
          )}

          {message && (
            <div
              className={`file-upload-message ${messageType}`}
              role="status"
            >
              {messageType === "success" ? (
                <CheckCircle size={19} />
              ) : (
                <AlertCircle size={19} />
              )}
              <span>{message}</span>
            </div>
          )}

          <div className="file-upload-actions">
            <p>Maximum file size is checked by the backend.</p>

            <div className="file-upload-buttons">
              <button
                type="button"
                className="file-clear-button"
                onClick={handleClear}
                disabled={!file || loading}
              >
                <X size={16} /> Clear
              </button>

              <button
                type="submit"
                className="file-submit-button"
                disabled={!file || loading}
              >
                <Upload size={16} />
                {loading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="file-upload-card">
        <h2 className="file-recent-heading">Recent Uploads</h2>

        {uploads.length === 0 ? (
          <div className="file-empty-state">
            <FileText
              size={28}
              style={{ display: "block", margin: "0 auto 10px" }}
            />
            No recent uploads to display.
          </div>
        ) : (
          <div className="file-table-container">
            <table className="file-uploads-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>File Type</th>
                  <th>Size</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {uploads.map((item) => (
                  <tr key={item.fileId}>
                    <td>
                      <FileText
                        size={17}
                        style={{
                          verticalAlign: "middle",
                          marginRight: "8px",
                        }}
                      />
                      {item.originalName}
                    </td>
                    <td>{item.type}</td>
                    <td>{formatSize(item.size)}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="file-view-button"
                        onClick={() => handleView(item)}
                      >
                        <Eye size={16} /> View
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
