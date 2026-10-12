
/*
 * Purpose: Upload CSV/XLSX lead files and poll the backend for
 * background import progress, success counts, and failure counts.
 */
import { useEffect, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download
} from "lucide-react";
import api from "../services/api";

function BulkImport() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [job, setJob] = useState(null);

  // Purpose: Poll the backend until the import reaches a terminal state.
  useEffect(() => {
    if (!job?.jobId) return undefined;

    const terminalStatuses = ["completed", "failed"];
    if (terminalStatuses.includes(job.status?.toLowerCase())) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId;

    const pollStatus = async () => {
      try {
        const response = await api.get(
          `/imports/${job.jobId}/status`
        );

        const result = response.data?.data ?? response.data;

        if (cancelled) return;

        setJob((previous) => ({
          ...previous,
          ...result,
          jobId: result.jobId || previous.jobId,
          filename: result.filename || previous.filename,
        }));

        setStatusError("");
      } catch (err) {
        if (!cancelled) {
          console.error("Import status error:", err);
          setStatusError(
            "Unable to refresh status. Retrying automatically..."
          );
        }
      }

      if (!cancelled) {
        timeoutId = setTimeout(pollStatus, 2000);
      }
    };

    timeoutId = setTimeout(pollStatus, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [job?.jobId, job?.status]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!["csv", "xlsx"].includes(extension)) {
      setFile(null);
      setError("Please select a CSV or XLSX file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }

    setError("");
    setStatusError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/imports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data?.data ?? response.data;

      if (!result?.jobId) {
        throw new Error("The server did not return an import job ID.");
      }

      setJob({
        ...result,
        jobId: result.jobId,
        filename: result.filename || file.name,
        status: result.status || "queued",
        total: result.total ?? 0,
        processed: result.processed ?? 0,
        succeeded: result.succeeded ?? 0,
        failed: result.failed ?? 0,
      });

      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Bulk import upload error:", err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
 * Purpose: Download the CSV error report for a completed import job.
 */
const handleDownloadErrors = async () => {
  try {
    setError("");

    const response = await api.get(
      `/imports/${job.jobId}/errors`,
      { responseType: "blob" }
    );

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = `import-errors-${job.jobId}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Error report download failed:", err);
    setError("Could not download the error report. Please try again.");
  }
};

/*
 * Purpose: Generate and download a CSV template with the required
 * lead-import columns and one illustrative example row.
 */
const handleDownloadTemplate = () => {
  const headers = [
    "full_name",
    "age",
    "phone_mobile",
    "country_code",
    "loan_account_no",
    "next_emi_date_dom",
    "emi_amount",
    "branch_code",
    "lead_status",
  ];

 const exampleRow = [
  "Example Customer",
  "30",
  "9876543210",
  "+91",
  "REPLACE_WITH_UNIQUE_ACCOUNT_NUMBER",
  "2026-11-15",
  "2500.00",
  "MUM01",
  "High",
];

  const csvContent = [
    headers.join(","),
    exampleRow.join(","),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = "lead-import-template.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(blobUrl);
};

  const status = job?.status?.toLowerCase() || "";
  const isFinished = ["completed", "failed"].includes(status);

  const total = Number(job?.total) || 0;
  const processed = Number(job?.processed) || 0;
  const succeeded = Number(job?.succeeded) || 0;
  const failed = Number(job?.failed) || 0;

  const progress = total > 0
    ? Math.min(100, Math.round((processed / total) * 100))
    : isFinished
      ? 100
      : 0;

  return (
    <section className="bulk-import-page">
     
{/* Purpose: Display the page heading and downloadable CSV template. */}
<div className="bulk-import-heading">
  <div>
    <h2>Bulk Import</h2>
    <p>Upload a CSV or Excel file to import multiple leads.</p>
  </div>

  <button
    type="button"
    className="secondary-button"
    onClick={handleDownloadTemplate}
  >
    <Download size={18} />
    Download Sample CSV
  </button>
</div>


      <div className="lead-form-card">
        {error && (
          <div className="form-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="bulk-upload-area">
            <Upload size={36} />
            <h3>Select your file</h3>
            <p>
              Supported formats: <strong>.csv</strong> and{" "}
              <strong>.xlsx</strong>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              disabled={loading}
            />

            {file && (
              <div className="selected-file">
                <FileSpreadsheet size={20} />
                <div className="selected-file-details">
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  aria-label="Remove selected file"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleRemoveFile}
              disabled={!file || loading}
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={!file || loading}
            >
              <Upload size={18} />
              {loading ? "Uploading..." : "Upload and Import"}
            </button>
          </div>
        </form>
      </div>

      {job && (
        <div className="lead-form-card bulk-import-result" role="status">
         {/* Purpose: Show the import heading and provide a sample CSV template. */}
          <p>
            <strong>Status:</strong> {job.status}
          </p>
          <p>
            <strong>Job ID:</strong> {job.jobId}
          </p>

          <div className="import-progress">
            <div className="import-progress-label">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>

            <progress value={progress} max="100" />

            <p>
              {processed.toLocaleString()} of{" "}
              {total.toLocaleString()} rows processed
            </p>
          </div>

          <div className="import-counts">
            <div>
              <span>Total</span>
              <strong>{total.toLocaleString()}</strong>
            </div>
            <div>
              <span>Successful</span>
              <strong>{succeeded.toLocaleString()}</strong>
            </div>
            <div>
              <span>Failed</span>
              <strong>{failed.toLocaleString()}</strong>
            </div>
          </div>

        {/* Purpose: Download the CSV report when rows have failed. */}
          {failed > 0 && isFinished && (
            <div className="form-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleDownloadErrors}
              >
                <Download size={18} />
                Download Error Report
              </button>
            </div>
          )}

          {statusError && (
            <p className="form-error">{statusError}</p>
          )}

          {/* Purpose: Show completion feedback and allow another import. */}
        {status === "completed" && (
         <div className="import-finished-actions">
           <p>Import completed. Review the row counts above.</p>

              <button
                type="button"
                className="primary-button"
               onClick={() => {
                 setJob(null);
                 setFile(null);
                 setError("");
                 setStatusError("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }}
    >
      <Upload size={18} />
      Import Another File
    </button>
  </div>
)}

{/* Purpose: Show failure feedback and allow a retry with another file. */}
{status === "failed" && (
  <div className="import-finished-actions">
    <p className="form-error">
      The import job failed. Check the error report if available.
    </p>

    <button
      type="button"
      className="primary-button"
      onClick={() => {
        setJob(null);
        setFile(null);
        setError("");
        setStatusError("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }}
    >
      <Upload size={18} />
      Try Another File
    </button>
  </div>
)}
        </div>
      )}
    </section>
  );
}

export default BulkImport;
