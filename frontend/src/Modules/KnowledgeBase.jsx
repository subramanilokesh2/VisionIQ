// App.jsx
import React, { useState, useEffect } from "react";

/* ---------------- MOCK ICONS ---------------- */
const Icons = {
  File: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Check: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Sparkles: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Upload: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Eye: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Trash2: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M12 2v4" />
    </svg>
  ),
  Folder: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Error: (props) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="#ef4444"
      strokeWidth="3"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
};

/* ---------------- CONSTANTS ---------------- */
const SUB_PRACTICES = [
  "M&A",
  "Automation",
  "Zones",
  "Private Equity",
  "Services",
  "Platforms",
];
const FILE_TYPES = ["PDF", "Excel", "PPT"];

/* ---------------- HELPERS ---------------- */
const getFileIconColor = (fileName) => {
  const type = fileName.split(".").pop().toLowerCase();
  if (["csv", "xlsx", "xls"].includes(type)) return "green";
  if (["pdf", "docx", "doc"].includes(type)) return "blue";
  if (["ppt", "pptx"].includes(type)) return "red";
  return "gray";
};

// rough ingest time estimate (seconds)
const estimateIngestTime = (rows, cols, sizeBytes) => {
  let seconds = 2;
  if (rows && cols) {
    seconds += rows * 0.00015 + cols * 0.05;
  } else if (sizeBytes) {
    seconds += (sizeBytes / (1024 * 1024)) * 0.8;
  }
  if (seconds < 1.5) seconds = 1.5;
  if (seconds > 45) seconds = 45;
  if (seconds <= 5) return "≈ 2 – 5 seconds";
  if (seconds <= 15) return "≈ 5 – 15 seconds";
  if (seconds <= 30) return "≈ 15 – 30 seconds";
  return "≈ 30 – 45 seconds";
};

/* ---------------- TOAST ---------------- */
const Toast = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === "success" ? <Icons.Check /> : <Icons.Error />}
      </div>
      <div className="toast-content">
        <div className="toast-title">
          {type === "success" ? "Success" : "Error"}
        </div>
        <div className="toast-msg">{message}</div>
      </div>
      <button onClick={onClose} className="toast-close">
        ×
      </button>
    </div>
  );
};

/* ---------------- DATASET CARD ---------------- */
const IngestedDatasetCard = ({ file, onDelete }) => {
  const iconColor = getFileIconColor(file.name);

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className="kb-card dataset-card">
      <div className="card-left">
        <Icons.File className={`icon file-icon icon-${iconColor}`} />
        <div className="file-info">
          <p className="file-name">{file.metadata.tableName}</p>
          <p className="file-meta">
            {file.name} | {formatSize(file.size)} |{" "}
            <span style={{ color: "var(--primary)", fontWeight: "bold" }}>
              {file.metadata.fileType}
            </span>{" "}
            | <b>{file.metadata.subPractice}</b>
          </p>
        </div>
      </div>
      <div className="card-right">
        <div className="status status-ingested">
          <Icons.Check className="icon icon-check" /> <b>Ingested</b>
        </div>
        <button
          onClick={() => onDelete(file._id || file.id)}
          className="delete-btn"
          title="Delete Dataset"
        >
          <Icons.Trash2 className="icon icon-trash" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- KNOWLEDGE BASE ---------------- */
const KnowledgeBase = ({
  uploadedFiles,
  onFileIngest,
  onDeleteDataset,
  isDarkMode,
  showToast,
}) => {
  const [file, setFile] = useState(null);

  const [metadata, setMetadata] = useState({
    tableName: "",
    subPractice: SUB_PRACTICES[0],
    fileType: "PDF",
    description: "",
  });

  // Single-sheet preview state
  const [previewColumns, setPreviewColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // Multi-sheet state
  const [sheets, setSheets] = useState([]); // [{ name, columns, rows, totalRows }]
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [selectedSheets, setSelectedSheets] = useState([]); // sheet names
  const [selectedColumnsPerSheet, setSelectedColumnsPerSheet] = useState({}); // { sheetName: [cols] }

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [error, setError] = useState("");

  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [fileObjectURL, setFileObjectURL] = useState(null);

  const resetPreview = () => {
    setPreviewColumns([]);
    setSelectedColumns([]);
    setPreviewRows([]);
    setTotalRows(0);
    setSheets([]);
    setActiveSheetIndex(0);
    setSelectedSheets([]);
    setSelectedColumnsPerSheet({});
    setError("");
  };

  // Sync legacy preview state with active sheet whenever sheets or active index changes
  useEffect(() => {
    if (
      sheets.length > 0 &&
      activeSheetIndex >= 0 &&
      activeSheetIndex < sheets.length
    ) {
      const activeSheet = sheets[activeSheetIndex];
      setPreviewColumns(activeSheet.columns || []);
      setPreviewRows(activeSheet.rows || []);
      setTotalRows(activeSheet.totalRows || 0);

      const sheetName = activeSheet.name;
      const colsForSheet =
        selectedColumnsPerSheet[sheetName] || activeSheet.columns || [];
      setSelectedColumns(colsForSheet);
    }
  }, [sheets, activeSheetIndex, selectedColumnsPerSheet]);

  // cleanup file object URL
  useEffect(() => {
    return () => {
      if (fileObjectURL) URL.revokeObjectURL(fileObjectURL);
    };
  }, [fileObjectURL]);

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    resetPreview();

    if (fileObjectURL) {
      URL.revokeObjectURL(fileObjectURL);
      setFileObjectURL(null);
    }
    const url = URL.createObjectURL(selected);
    setFileObjectURL(url);

    // Auto-fill table name
    let baseName = selected.name.split(".").slice(0, -1).join(".");
    baseName = baseName
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Auto-detect file type
    const ext = selected.name.split(".").pop().toLowerCase();
    let detectedType = "PDF";
    if (ext.includes("xl") || ext.includes("csv")) detectedType = "Excel";
    if (ext.includes("ppt")) detectedType = "PPT";

    setMetadata((prev) => ({
      ...prev,
      tableName: baseName,
      fileType: detectedType,
    }));

    // open dialog immediately
    setShowPreviewDialog(true);

    // Excel / CSV → get preview from backend
    if (["xlsx", "xls", "csv"].includes(ext)) {
      try {
        setLoadingPreview(true);
        const formData = new FormData();
        formData.append("file", selected);

        const res = await fetch("http://localhost:5000/api/datasets/preview", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Preview failed");
        }

        const data = await res.json();

        // Multi-sheet case (backend returns { sheets: [...] })
        if (Array.isArray(data.sheets) && data.sheets.length > 0) {
          setSheets(data.sheets);

          const allSheetNames = data.sheets.map((s) => s.name);
          setSelectedSheets(allSheetNames);

          const initialColsPerSheet = {};
          data.sheets.forEach((sheet) => {
            initialColsPerSheet[sheet.name] = sheet.columns || [];
          });
          setSelectedColumnsPerSheet(initialColsPerSheet);

          setActiveSheetIndex(0);
        } else {
          // Single-sheet fallback (original behavior)
          const columns = data.columns || [];
          const rows = data.rows || [];
          const total = data.totalRows || 0;

          setPreviewColumns(columns);
          setSelectedColumns(columns);
          setPreviewRows(rows);
          setTotalRows(total);
        }
      } catch (err) {
        console.error(err);
        setError("Error while generating preview. Please try again.");
        showToast(
          "⚠️ Error while generating preview. Please try again.",
          "error"
        );
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const toggleColumn = (col) => {
    // Single-sheet state
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );

    // Multi-sheet sync
    if (
      sheets.length > 0 &&
      activeSheetIndex >= 0 &&
      activeSheetIndex < sheets.length
    ) {
      const sheetName = sheets[activeSheetIndex].name;
      setSelectedColumnsPerSheet((prev) => {
        const currentForSheet = prev[sheetName] || [];
        const updated = currentForSheet.includes(col)
          ? currentForSheet.filter((c) => c !== col)
          : [...currentForSheet, col];
        return { ...prev, [sheetName]: updated };
      });
    }
  };

  const toggleSheetSelection = (sheetName) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((n) => n !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleIngest = async () => {
    if (!file || !metadata.tableName) return;

    // Multi-sheet validation
    if (sheets.length > 0) {
      if (selectedSheets.length === 0) {
        const msg = "⚠️ Please select at least one sheet to ingest.";
        setError(msg);
        showToast(msg, "error");
        return;
      }

      for (const sheetName of selectedSheets) {
        const cols = selectedColumnsPerSheet[sheetName] || [];
        if (cols.length === 0) {
          const msg = `⚠️ Please select at least one column to ingest for sheet "${sheetName}".`;
          setError(msg);
          showToast(msg, "error");
          return;
        }
      }
    } else {
      // Single-sheet validation
      if (
        ["Excel", "PPT"].includes(metadata.fileType) &&
        previewColumns.length > 0 &&
        selectedColumns.length === 0
      ) {
        const msg = "⚠️ Please select at least one column to ingest.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
    }

    try {
      setLoadingIngest(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));

      if (sheets.length > 0) {
        formData.append("selectedSheets", JSON.stringify(selectedSheets));
        formData.append(
          "selectedColumnsPerSheet",
          JSON.stringify(selectedColumnsPerSheet)
        );
      } else {
        formData.append("selectedColumns", JSON.stringify(selectedColumns));
      }

      const res = await fetch("http://localhost:5000/api/datasets/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Ingestion failed");
      }

      const data = await res.json();
      onFileIngest(data.dataset);

      setFile(null);
      resetPreview();
      setMetadata({
        tableName: "",
        subPractice: SUB_PRACTICES[0],
        fileType: "PDF",
        description: "",
      });
      const input = document.getElementById("file-upload");
      if (input) input.value = "";

      showToast("🎉 Dataset ingested successfully!", "success");
    } catch (err) {
      console.error(err);
      const msg = "❌ Error while ingesting dataset. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoadingIngest(false);
    }
  };

  const renderPreviewStatus = () => {
    if (!file) {
      return "Upload a file to start the pre-ingestion preview process (e.g., column header mapping for Excel files).";
    }

    if (loadingPreview) {
      return "Generating preview from the uploaded file...";
    }

    if (!loadingPreview && file) {
      if (sheets.length > 0) {
        const activeSheet = sheets[activeSheetIndex] || sheets[0];
        return (
          <>
            Ready for ingestion: <b>{file.name}</b> ({metadata.fileType}){" "}
            <br />
            <span>
              Detected <b>{sheets.length} sheets</b>. Currently viewing{" "}
              <b>{activeSheet.name}</b>.{" "}
              {activeSheet.totalRows > 0 && (
                <>
                  Approx. <b>{activeSheet.totalRows} rows</b> in this sheet
                  (showing first {activeSheet.rows?.length || 0} rows
                  below).
                </>
              )}
            </span>
          </>
        );
      } else if (totalRows > 0) {
        return (
          <>
            Ready for ingestion: <b>{file.name}</b> ({metadata.fileType}){" "}
            <br />
            Detected{" "}
            <b>
              {previewColumns.length} columns, approx. {totalRows} rows
            </b>{" "}
            (showing first {previewRows.length} rows below)
          </>
        );
      } else {
        return (
          <>
            Ready for ingestion: <b>{file.name}</b> ({metadata.fileType})
          </>
        );
      }
    }

    return null;
  };

  const isExcelLike =
    metadata.fileType === "Excel" ||
    (file && /\.(xlsx|xls|csv)$/i.test(file.name));
  const isPDF =
    file &&
    (file.type === "application/pdf" || /\.pdf$/i.test(file.name));

  const currentTotalCols =
    sheets.length > 0
      ? (sheets[activeSheetIndex]?.columns || []).length
      : previewColumns.length;

  const rowsForEstimate =
    sheets.length > 0
      ? sheets[activeSheetIndex]?.totalRows || totalRows
      : totalRows;

  const ingestEstimate = estimateIngestTime(
    rowsForEstimate,
    currentTotalCols,
    file?.size || 0
  );

  return (
    <div className="kb-container fade-in-up">
      <h1 className="kb-header">Knowledge Base Ingestion</h1>

      <div className="kb-grid">
        {/* Upload / Metadata Card */}
        <div className="kb-card upload-card">
          <h2 className="card-title">
            <Icons.Upload className="icon title-icon" />{" "}
            <b>New Dataset Ingestion</b>
          </h2>
          <label htmlFor="file-upload" className="file-upload-label">
            {file
              ? `File Selected: ${file.name}`
              : "Click to select file (Excel, PDF, PPT)"}
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          <label className="input-label">Document Title</label>
          <input
            type="text"
            placeholder="e.g., Q4 Performance Data"
            value={metadata.tableName}
            onChange={(e) =>
              setMetadata((prev) => ({
                ...prev,
                tableName: e.target.value,
              }))
            }
          />

          <div className="meta-row">
            <div className="meta-col">
              <label className="input-label">Sub-Practice</label>
              <select
                value={metadata.subPractice}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    subPractice: e.target.value,
                  }))
                }
              >
                {SUB_PRACTICES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="meta-col">
              <label className="input-label">File Type</label>
              <select
                value={metadata.fileType}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    fileType: e.target.value,
                  }))
                }
              >
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="input-label">Description</label>
          <textarea
            placeholder="Brief Description (e.g., Client-specific M&A data from 2023)"
            value={metadata.description}
            onChange={(e) =>
              setMetadata((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows="3"
          ></textarea>

          {error && (
            <div
              style={{
                marginTop: 5,
                fontSize: "0.8rem",
                color: "var(--negative)",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleIngest}
            disabled={!file || !metadata.tableName || loadingIngest}
          >
            {loadingIngest ? "Ingesting..." : "Start Ingestion"}{" "}
            <Icons.Sparkles className="icon sparkles" />
          </button>
        </div>

        {/* Preview / Instructions Card */}
        <div className="kb-card preview-card">
          <h2 className="card-title">
            <Icons.Eye className="icon title-icon" />{" "}
            <b>Sanitization & Preview</b>
          </h2>

          <p className="preview-status">{renderPreviewStatus()}</p>

          <div className="preview-step">1. Upload File (Client Strategy Data)</div>
          <div className="preview-step active">
            2. Map Columns (Excel only)
          </div>
          <div className="preview-step">3. Finalize and Ingest</div>

          {/* Sheet selection for multi-sheet */}
          {file && sheets.length > 1 && (
            <div style={{ marginTop: 15 }}>
              <div className="sheet-label">
                Sheets detected in workbook:
              </div>
              <div className="sheet-chip-row">
                {sheets.map((sheet, idx) => {
                  const isActive = idx === activeSheetIndex;
                  const isSelected = selectedSheets.includes(sheet.name);
                  return (
                    <button
                      key={sheet.name}
                      type="button"
                      onClick={() => setActiveSheetIndex(idx)}
                      className={`sheet-chip ${isActive ? "active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSheetSelection(sheet.name);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      {sheet.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Column selection + preview table */}
          {file && previewColumns.length > 0 && (
            <div className="preview-scroll">
              <div className="select-cols-label">
                Select columns you want to ingest:
              </div>
              <div className="col-chip-row">
                {previewColumns.map((col) => (
                  <label
                    key={col}
                    className={
                      "col-chip " +
                      (selectedColumns.includes(col) ? "active" : "")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                    {col}
                  </label>
                ))}
              </div>

              <div className="data-preview-label">
                Data preview (first {previewRows.length} rows):
              </div>
              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {previewColumns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {previewColumns.map((c) => (
                          <td key={c}>
                            {row[c] !== undefined && row[c] !== null
                              ? String(row[c])
                              : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={previewColumns.length}
                          style={{ padding: 8, textAlign: "center" }}
                        >
                          No data rows detected in sheet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="kb-asset-header">
        Active Knowledge Assets ({uploadedFiles.length})
      </h2>
      <div className="uploaded-list">
        {uploadedFiles.length === 0 ? (
          <div className="empty-list">
            <Icons.Folder className="icon large-icon" />{" "}
            <b>No datasets currently ingested.</b>
          </div>
        ) : (
          uploadedFiles.map((f) => (
            <IngestedDatasetCard
              key={f._id || f.id}
              file={f}
              onDelete={onDeleteDataset}
            />
          ))
        )}
      </div>

      {/* ===== PREVIEW DIALOG ===== */}
      {showPreviewDialog && file && (
        <div className="kb-dialog-backdrop">
          <div className="kb-dialog">
            <div className="kb-dialog-header">
              <div className="kb-dialog-title">
                <Icons.File className="icon dialog-file-icon" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                    Preview: {metadata.tableName || file.name}
                  </div>
                  <div className="kb-dialog-subtitle">
                    {file.name} · {metadata.fileType} ·{" "}
                    {file.size
                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Size unknown"}
                  </div>
                </div>
              </div>
              <button
                className="kb-dialog-close"
                onClick={() => setShowPreviewDialog(false)}
              >
                ×
              </button>
            </div>

            <div className="kb-dialog-body">
              <div className="kb-dialog-meta-grid">
                <div className="kb-dialog-meta-card">
                  <div className="meta-label">Total Rows</div>
                  <div className="meta-value">
                    {isExcelLike
                      ? rowsForEstimate || (loadingPreview ? "Loading…" : "0")
                      : "Not applicable"}
                  </div>
                </div>
                <div className="kb-dialog-meta-card">
                  <div className="meta-label">Total Columns</div>
                  <div className="meta-value">
                    {isExcelLike
                      ? currentTotalCols || (loadingPreview ? "Loading…" : "0")
                      : "Not applicable"}
                  </div>
                </div>
                <div className="kb-dialog-meta-card">
                  <div className="meta-label">Sub-Practice</div>
                  <div className="meta-value">{metadata.subPractice}</div>
                </div>
                <div className="kb-dialog-meta-card">
                  <div className="meta-label">Estimated Time to Ingest</div>
                  <div className="meta-value">{ingestEstimate}</div>
                </div>
              </div>

              <div className="kb-dialog-preview-area">
                {loadingPreview && isExcelLike ? (
                  <div className="kb-dialog-loading">
                    Generating column & row preview from Excel…
                  </div>
                ) : isExcelLike && previewColumns.length > 0 ? (
                  <div className="kb-dialog-table-wrapper">
                    <div className="kb-dialog-preview-title">
                      Excel sample (first {previewRows.length} rows)
                    </div>
                    <div className="table-wrapper">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            {previewColumns.map((c) => (
                              <th key={c}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, idx) => (
                            <tr key={idx}>
                              {previewColumns.map((c) => (
                                <td key={c}>
                                  {row[c] !== undefined && row[c] !== null
                                    ? String(row[c])
                                    : ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {previewRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={previewColumns.length}
                                style={{
                                  padding: 8,
                                  textAlign: "center",
                                }}
                              >
                                No data rows detected in sheet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : isPDF && fileObjectURL ? (
                  <div className="kb-dialog-pdf-wrapper">
                    <div className="kb-dialog-preview-title">
                      PDF inline preview
                    </div>
                    <embed
                      src={fileObjectURL}
                      type="application/pdf"
                      className="kb-dialog-pdf-embed"
                    />
                  </div>
                ) : (
                  <div className="kb-dialog-generic-preview">
                    <div className="kb-dialog-preview-title">
                      Quick file summary
                    </div>
                    <p>
                      A detailed inline preview is not available for this file
                      type, but you can proceed with ingestion. The estimated
                      time above is based on file size.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="kb-dialog-footer">
              <button
                className="kb-dialog-btn secondary"
                onClick={() => setShowPreviewDialog(false)}
              >
                Close
              </button>
              <button
                className="kb-dialog-btn primary"
                onClick={() => setShowPreviewDialog(false)}
              >
                Proceed to Ingestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE STYLES */}
      <style>{`
        :root {
          --bg-dark: #070919; --bg-light: #f1f5f9;
          --sidebar-dark: rgba(15, 17, 26, 0.95); --sidebar-light: #ffffff;
          --text-main: #f1f5f9; --text-muted: #94a3b8;
          --primary: #6366f1; --accent: #a855f7;
          --glass: rgba(255, 255, 255, 0.05); 
          --border: rgba(255,255,255,0.08);
          --positive: #10b981; --negative: #ef4444; 
          --shadow-lg: 0 10px 30px rgba(0,0,0,0.5);
          --card-bg-dark: rgba(15, 17, 26, 0.8);
        }
        [data-theme="light"] { 
            --bg-dark: #f1f5f9; --text-main: #1e293b; --sidebar-dark: #ffffff; 
            --border: #e2e8f0; --glass: rgba(0,0,0,0.03);
            --shadow-lg: 0 10px 30px rgba(0,0,0,0.1);
            --card-bg-dark: #ffffff;
        }
        
        .kb-wrapper {
            min-height: 100vh;
            padding: 30px;
            background-color: var(--bg-dark);
            background-image: radial-gradient(at 0% 0%, rgba(99,102,241,0.15) 0, transparent 50%),
                             radial-gradient(at 100% 100%, rgba(168,85,247,0.1) 0, transparent 50%);
            color: var(--text-main);
        }

        .kb-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
        .kb-header { 
            font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 40px; 
            color: var(--primary);
        }
        .kb-asset-header { 
            font-size: 1.8rem; margin-top: 40px; margin-bottom: 20px;
            color: var(--text-main);
        }
        
        .kb-grid { 
          display: grid; 
          grid-template-columns: minmax(0,1fr) minmax(0,1fr); 
          gap: 30px; 
          margin-bottom: 40px; 
          align-items: flex-start;
        }
        
        .kb-card { 
            background: var(--card-bg-dark); 
            backdrop-filter: blur(5px); 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            padding: 25px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
            transition: all 0.3s ease;
            position: relative;
            overflow: visible;
        }
        .kb-card:hover { 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
            transform: translateY(-2px);
        }
        
        .card-title { 
            font-size: 1.5rem; margin-top: 0; margin-bottom: 20px; 
            display: flex; align-items: center; gap: 10px; 
            color: var(--primary); 
            font-weight: 600;
        }
        .title-icon { color: var(--accent); }

        .file-upload-label {
            display: block;
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            border-radius: 8px;
            border: 2px dashed var(--border);
            color: var(--text-muted);
            text-align: center;
            cursor: pointer;
            background: var(--glass);
            transition: all 0.3s;
        }
        .file-upload-label:hover {
            border-color: var(--primary);
            color: var(--primary);
        }

        .input-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-left: 2px;
            margin-top: 10px;
            display: block;
        }

        .meta-row {
          display: flex;
          gap: 10px;
          margin-bottom: 5px;
          flex-wrap: wrap;
        }

        .meta-col {
          flex: 1 1 140px;
          min-width: 0;
        }

        input[type="text"], select, textarea { 
            width: 100%; padding: 10px; margin: 5px 0 10px 0; 
            border-radius: 8px; 
            border: 1px solid var(--border); 
            background: var(--glass); 
            color: var(--text-main); 
            font-size: 0.95rem; 
            transition: border 0.3s ease, box-shadow 0.3s ease, background 0.2s ease;
        }

        select {
          background-color: rgba(15,23,42,0.95);
          color: var(--text-main);
        }
        select option {
          background-color: #f9fafb;
          color: #0f172a;
        }
        [data-theme="light"] select {
          background-color: #ffffff;
          color: #0f172a;
        }
        [data-theme="light"] select option {
          background-color: #ffffff;
          color: #0f172a;
        }

        input[type="text"]:focus, select:focus, textarea:focus { 
            border-color: var(--primary); 
            box-shadow: 0 0 10px rgba(99,102,241,0.3); 
            outline: none; 
        }
        textarea { resize: vertical; }

        button:not(.delete-btn):not(.kb-dialog-btn) { 
            background: var(--primary); 
            color: white; 
            font-weight: bold; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 10px; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            transition: background 0.3s ease, transform 0.2s ease;
            margin-top: 15px;
            width: 100%;
            justify-content: center;
        }
        button:hover:not(:disabled):not(.delete-btn):not(.kb-dialog-btn) { background: #4338ca; transform: translateY(-2px); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .sparkles { animation: sparkle 1s infinite alternate; }
        @keyframes sparkle { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        
        .preview-status { font-size: 1rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5; }
        .preview-step {
            padding: 10px 15px;
            border-left: 3px solid var(--border);
            margin-bottom: 10px;
            color: var(--text-muted);
            transition: all 0.3s;
            font-weight: 500;
        }
        .preview-step.active {
            border-left: 3px solid var(--accent);
            background: rgba(168, 85, 247, 0.1);
            color: var(--accent);
            font-weight: 700;
        }

        .sheet-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .sheet-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sheet-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: transparent;
          font-size: 0.8rem;
          cursor: pointer;
          color: var(--text-main);
        }
        .sheet-chip.active {
          border-color: var(--primary);
          background: rgba(99,102,241,0.15);
        }

        .preview-scroll {
          margin-top: 15px;
          max-height: 320px;
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 10px;
          overflow: auto;
          background: rgba(15,23,42,0.7);
        }

        .select-cols-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .col-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .col-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          font-size: 0.8rem;
          cursor: pointer;
          background: transparent;
          color: var(--text-main);
        }
        .col-chip.active {
          background: rgba(99,102,241,0.18);
          border-color: var(--primary);
        }

        .data-preview-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 4px;
          font-weight: 500;
        }

        .table-wrapper {
          border-radius: 8px;
          border: 1px solid var(--border);
          overflow: auto;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          min-width: max-content;
        }
        .preview-table th,
        .preview-table td {
          padding: 6px 8px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .preview-table thead th {
          position: sticky;
          top: 0;
          background: var(--card-bg-dark);
          z-index: 1;
        }
        .preview-table td {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uploaded-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
        
        .dataset-card { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 15px 20px; 
            background: var(--glass);
        }
        .card-left { display: flex; align-items: center; gap: 15px; }
        .card-right { display: flex; align-items: center; gap: 15px; }
        
        .file-info { max-width: 400px; overflow: hidden; }
        .file-name { font-weight: bold; font-size: 1rem; color: var(--text-main); margin: 0; }
        .file-meta { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
        
        .status-ingested { 
            display: flex; align-items: center; gap: 5px; 
            background: rgba(16, 185, 129, 0.15);
            color: var(--positive); 
            padding: 5px 10px; 
            border-radius: 999px; 
            font-size: 0.8rem; 
            font-weight: 600; 
        }
        .icon-check { width: 12px; height: 12px; stroke-width: 3; }
        
        .delete-btn { 
            background: rgba(239, 68, 68, 0.15); 
            padding: 8px; 
            border-radius: 50%; 
            transition: background 0.2s ease;
            border: none;
            cursor: pointer;
        }
        .delete-btn:hover { background: rgba(239, 68, 68, 0.3); }
        .icon-trash { color: var(--negative); width: 16px; height: 16px; }

        .file-icon { width: 24px; height: 24px; }
        .icon-green { color: var(--positive); }
        .icon-blue { color: #3b82f6; }
        .icon-red { color: var(--negative); }
        .icon-gray { color: var(--text-muted); }

        .empty-list { 
            background: var(--glass); 
            border: 1px solid var(--border);
            border-left: 4px solid var(--primary); 
            padding: 15px; 
            border-radius: 10px; 
            display: flex; align-items: center; gap: 10px; 
            color: var(--primary); 
            font-weight: 600;
            margin-top: 20px;
        }
        .large-icon { width: 28px; height: 28px; }

        @media (max-width: 900px) {
            .kb-grid { grid-template-columns: 1fr; }
            .dataset-card { flex-direction: column; align-items: flex-start; gap: 10px; }
            .card-right { margin-top: 10px; }
        }

        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Dialog styles */
        .kb-dialog-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }
        .kb-dialog {
          width: min(900px, 95vw);
          max-height: 90vh;
          background: var(--card-bg-dark);
          border-radius: 18px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .kb-dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .kb-dialog-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dialog-file-icon {
          width: 28px;
          height: 28px;
          color: var(--primary);
        }
        .kb-dialog-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .kb-dialog-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 4px;
        }
        .kb-dialog-close:hover {
          color: #e2e8f0;
        }
        .kb-dialog-body {
          padding: 16px 20px 12px 20px;
          overflow: auto;
        }
        .kb-dialog-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .kb-dialog-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .kb-dialog-meta-card {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(15,23,42,0.85);
          border: 1px solid var(--border);
        }
        .meta-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 3px;
        }
        .meta-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .kb-dialog-preview-area {
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 10px;
          background: rgba(15,23,42,0.9);
          max-height: 420px;
          overflow: auto;
        }
        .kb-dialog-preview-title {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .kb-dialog-loading {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .kb-dialog-table-wrapper {
          max-height: 380px;
          overflow: auto;
        }
        .kb-dialog-pdf-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .kb-dialog-pdf-embed {
          width: 100%;
          height: 360px;
          border-radius: 8px;
          border: none;
        }
        .kb-dialog-generic-preview p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .kb-dialog-footer {
          padding: 12px 20px 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .kb-dialog-btn {
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .kb-dialog-btn.primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .kb-dialog-btn.primary:hover {
          background: #4338ca;
        }
        .kb-dialog-btn.secondary {
          background: transparent;
          color: var(--text-muted);
          border-color: var(--border);
        }
        .kb-dialog-btn.secondary:hover {
          background: rgba(148,163,184,0.12);
          color: var(--text-main);
        }

        /* Toast styles */
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 300;
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          animation: slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          min-width: 300px;
          color: #0f172a;
        }
        .toast.success { border-left: 4px solid #10b981; }
        .toast.error { border-left: 4px solid #ef4444; }
        .toast-title { font-weight: 700; color: #0f172a; font-size: 0.95rem; margin-bottom: 2px; }
        .toast-msg { color: #64748b; font-size: 0.9rem; }
        .toast-close { background: none; border: none; font-size: 1.5rem; color: #cbd5e1; cursor: pointer; margin-left: auto; line-height: 1; }
        .toast-icon { margin-top: 2px; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

/* ---------------- APP WRAPPER ---------------- */
const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Fetch datasets from backend
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/datasets");
        const data = await res.json();
        setUploadedFiles(data.datasets || []);
      } catch (err) {
        console.error("Error fetching datasets:", err);
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  const handleIngest = (dataset) =>
    setUploadedFiles((prev) => [dataset, ...prev]);

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/datasets/${id}`, {
        method: "DELETE",
      });
      setUploadedFiles((prev) => prev.filter((f) => (f._id || f.id) !== id));
      setToast({
        show: true,
        message: "🗑️ Dataset deleted successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Error deleting dataset:", err);
      setToast({
        show: true,
        message: "❌ Error deleting dataset.",
        type: "error",
      });
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  return (
    <div className="kb-wrapper" data-theme={isDarkMode ? "dark" : "light"}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        {/* Dark / light toggle placeholder */}
      </div>
      <KnowledgeBase
        uploadedFiles={uploadedFiles}
        onFileIngest={handleIngest}
        onDeleteDataset={handleDelete}
        isDarkMode={isDarkMode}
        showToast={showToast}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
};

export default App;
