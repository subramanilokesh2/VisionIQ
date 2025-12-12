// Databases.jsx
import React, { useEffect, useMemo, useState } from "react";

// --- Icons ---
const Icons = {
  Database: () => (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.5 4 3 9 3s9-1.5 9-3V5" />
      <path d="M3 12c0 1.5 4 3 9 3s9-1.5 9-3" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  Play: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Pdf: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 15V9h2.5a2 2 0 0 1 0 4H8" />
      <path d="M14 9h3v6h-3z" />
    </svg>
  ),
  Excel: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M10 8l4 8M14 8l-4 8" />
    </svg>
  ),
  Ppt: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 9h4a2 2 0 0 1 0 4H8z" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  Sparkles: () => (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
      <path d="M6 16l.8 1.8L9 18.5 7.8 19.8 7 22l-.8-2.2L5 18.5l1.2-.7L6 16z" />
      <path d="M18 14l.8 1.8 1.2.7-1.2.7L18 19l-.8-1.8L16 16.5l1.2-.7L18 14z" />
    </svg>
  ),
};

// Helper: quick relative time label
const formatRelativeTime = (iso) => {
  if (!iso) return "N/A";
  const dt = new Date(iso);
  const diffMs = Date.now() - dt.getTime();
  if (diffMs < 60 * 1000) return "Just now";
  const mins = Math.round(diffMs / (60 * 1000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

// Helper: detect if dataset is Excel-like
const isExcelType = (dataset) => {
  const type = dataset.metadata?.fileType?.toLowerCase() || "";
  const name = dataset.name.toLowerCase();
  return (
    type.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  );
};

// Helper: doc-like (pdf, ppt, doc)
const isDocType = (dataset) => {
  const name = dataset.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  );
};

// Normalized file type for filters
const getNormalizedFileType = (dataset) => {
  const ft = (dataset.metadata?.fileType || "").toLowerCase();
  const name = dataset.name.toLowerCase();
  if (ft.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (
    ft.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  )
    return "Excel";
  if (ft.includes("ppt") || name.endsWith(".ppt") || name.endsWith(".pptx"))
    return "PPT";
  return dataset.metadata?.fileType || "Others";
};

const getFileTypeIcon = (fileType) => {
  if (fileType === "PDF") return <Icons.Pdf />;
  if (fileType === "Excel") return <Icons.Excel />;
  if (fileType === "PPT") return <Icons.Ppt />;
  return <Icons.Database />;
};

// --- Databases Component ---
const Databases = () => {
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [error, setError] = useState("");

  // Dialog state
  const [activeGroup, setActiveGroup] = useState(null); // { subPractice, fileType, items[] }
  const [viewDialog, setViewDialog] = useState(null); // { mode, dataset, columns, rows, sheets? }
  const [loadingData, setLoadingData] = useState(false);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0); // for multi-sheet excel

  // 🔹 VISIONIQ dialog state
  const [visionDialog, setVisionDialog] = useState(null); // { dataset, question, answer }
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");

  // Filter state
  const [selectedPractice, setSelectedPractice] = useState("All");
  const [selectedFileType, setSelectedFileType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Load datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoadingDatasets(true);
        const res = await fetch("http://localhost:5000/api/datasets");
        const data = await res.json();
        if (data.success) {
          const list = (data.datasets || []).map((ds) => ({
            ...ds,
            _normalizedFileType: getNormalizedFileType(ds),
          }));
          setDatasets(list);
        } else {
          setError("Failed to load datasets");
        }
      } catch (err) {
        console.error("Error fetching datasets:", err);
        setError("Error while fetching datasets");
      } finally {
        setLoadingDatasets(false);
      }
    };
    fetchDatasets();
  }, []);

  // Distinct practices + types for filters
  const allPractices = useMemo(() => {
    const s = new Set();
    datasets.forEach((d) => {
      const sp = d.metadata?.subPractice || "Unknown";
      s.add(sp);
    });
    return ["All", ...Array.from(s).sort()];
  }, [datasets]);

  const allTypes = useMemo(() => {
    const s = new Set();
    datasets.forEach((d) => {
      s.add(d._normalizedFileType);
    });
    const ordered = ["PDF", "Excel", "PPT"];
    const rest = Array.from(s).filter((t) => !ordered.includes(t));
    return ["All", ...ordered.filter((t) => s.has(t)), ...rest.sort()];
  }, [datasets]);

  // Group datasets by Sub-Practice + FileType
  const groups = useMemo(() => {
    const map = new Map(); // key = `${subPractice}|${fileType}`

    for (const ds of datasets) {
      const sp = ds.metadata?.subPractice || "Unknown";
      const ft = ds._normalizedFileType || "Unknown";

      // Practice filter
      if (selectedPractice !== "All" && sp !== selectedPractice) continue;
      // FileType filter
      if (selectedFileType !== "All" && ft !== selectedFileType) continue;
      // Search filter (title or file name)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const title = (ds.metadata?.tableName || "").toLowerCase();
        const name = ds.name.toLowerCase();
        if (!title.includes(term) && !name.includes(term)) continue;
      }

      const key = `${sp}|${ft}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(ds);
    }

    return Array.from(map.entries()).map(([key, items]) => {
      const [subPractice, fileType] = key.split("|");
      // compute lastSync as latest createdAt
      let lastCreated = null;
      items.forEach((d) => {
        const c = d.createdAt ? new Date(d.createdAt) : null;
        if (c && (!lastCreated || c > lastCreated)) lastCreated = c;
      });
      return {
        subPractice,
        fileType,
        items,
        lastSync: lastCreated
          ? formatRelativeTime(lastCreated.toISOString())
          : "N/A",
      };
    });
  }, [datasets, selectedPractice, selectedFileType, searchTerm]);

  // Card data for sources
  const dataSources = useMemo(() => {
    if (!groups.length) {
      return [
        {
          id: "placeholder",
          name: "No datasets match the selected filters",
          status: "Offline",
          lastSync: "N/A",
          group: null,
        },
      ];
    }

    return groups.map((g, idx) => ({
      id: `${g.subPractice}-${g.fileType}-${idx}`,
      name: `${g.subPractice} – ${g.fileType} Files`,
      status: "Online",
      lastSync: g.lastSync,
      group: g,
    }));
  }, [groups]);

  // Open group dialog
  const handleConfigure = (group) => {
    if (!group) return;
    setActiveGroup(group);
  };

  // --- VIEW / EDIT HANDLERS ---

  const openDocView = (dataset) => {
    // For docs, we show overlay until iframe loads
    setLoadingData(true);
    setViewDialog({
      mode: "doc",
      dataset,
      rows: null,
      columns: null,
    });
  };

  const openExcelView = async (dataset, editable = false) => {
    try {
      setLoadingData(true);
      setActiveSheetIndex(0);
      const res = await fetch(
        `http://localhost:5000/api/datasets/${dataset._id}/rows?limit=200`
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch rows");
      }

      // Multi-sheet aware
      if (Array.isArray(data.sheets) && data.sheets.length > 0) {
        setViewDialog({
          mode: editable ? "excel-edit" : "excel-view",
          dataset,
          sheets: data.sheets, // [{ name, columns, rows, totalRows }]
        });
      } else {
        // single sheet fallback
        setViewDialog({
          mode: editable ? "excel-edit" : "excel-view",
          dataset,
          columns: data.columns || [],
          rows: data.rows || [],
          totalRows: data.totalRows,
        });
      }
    } catch (error) {
      console.error("Error loading rows:", error);
      alert("Error loading Excel data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleExcelCellChange = (rowIndex, col, value) => {
    setViewDialog((prev) => {
      if (!prev) return prev;

      // Multi-sheet edit
      if (Array.isArray(prev.sheets) && prev.sheets.length > 0) {
        const sheetsCopy = prev.sheets.map((s) => ({
          ...s,
          rows: s.rows ? [...s.rows] : [],
        }));
        const activeSheet = sheetsCopy[activeSheetIndex];
        if (!activeSheet || !activeSheet.rows) return prev;

        const rowCopy = {
          ...(activeSheet.rows[rowIndex] || {}),
          [col]: value,
        };
        activeSheet.rows[rowIndex] = rowCopy;

        sheetsCopy[activeSheetIndex] = activeSheet;
        return { ...prev, sheets: sheetsCopy };
      }

      // Single sheet edit
      if (!prev.rows) return prev;
      const newRows = [...prev.rows];
      newRows[rowIndex] = { ...newRows[rowIndex], [col]: value };
      return { ...prev, rows: newRows };
    });
  };

  const handleSaveExcel = async () => {
    if (!viewDialog || !viewDialog.dataset) return;
    try {
      setLoadingData(true);

      const isMultiSheet =
        Array.isArray(viewDialog.sheets) && viewDialog.sheets.length > 0;

      const body = isMultiSheet
        ? {
            sheets: viewDialog.sheets.map((s) => ({
              name: s.name,
              columns: s.columns,
              rows: s.rows,
            })),
          }
        : {
            columns: viewDialog.columns,
            rows: viewDialog.rows,
          };

      const res = await fetch(
        `http://localhost:5000/api/datasets/${viewDialog.dataset._id}/rows`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to save rows");
      }
      alert("✅ Excel data updated successfully!");
      setViewDialog(null);
      setActiveSheetIndex(0);
    } catch (error) {
      console.error("Save excel error:", error);
      alert("❌ Error while saving changes. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const closeAllDialogs = () => {
    setViewDialog(null);
    setActiveGroup(null);
    setActiveSheetIndex(0);
    setLoadingData(false);
  };

  // 🔹 VisionIQ: open dialog & call backend
  const openVisionSummary = async (dataset) => {
    setVisionDialog({
      dataset,
      question:
        "Provide a concise consultant-style summary of this file: key insights, structure, and how it can be used for strategy or analysis.",
      answer: "",
    });
    setVisionError("");
    setVisionLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/visioniq/summarize-file",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datasetId: dataset._id,
            question:
              "Summarize this knowledge asset and highlight 3–5 key insights and recommended next steps for a Zinnov consultant.",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "VisionIQ summarization failed");
      }

      setVisionDialog((prev) =>
        prev
          ? {
              ...prev,
              answer: data.answer || "",
            }
          : prev
      );
    } catch (err) {
      console.error("VisionIQ summarize error:", err);
      setVisionError(
        err.message ||
          "Error while generating VisionIQ summary. Please try again."
      );
    } finally {
      setVisionLoading(false);
    }
  };

  const closeVisionDialog = () => {
    setVisionDialog(null);
    setVisionError("");
    setVisionLoading(false);
  };

  return (
    <div className="databases-container fade-in-up">
      <h2>Data Source Management</h2>
      <p className="text-muted">
        Monitor connection health and synchronization status of all data
        pipelines.
      </p>

      {/* FILTER BAR: practice, type, search */}
      <div className="db-filter-bar">
        <div className="db-filter-row">
          <div className="db-filter-group">
            <label className="db-filter-label">Sub-Practice</label>
            <select
              className="db-filter-select"
              value={selectedPractice}
              onChange={(e) => setSelectedPractice(e.target.value)}
            >
              {allPractices.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div className="db-filter-group">
            <label className="db-filter-label">File Type</label>
            <div className="db-type-chips">
              {allTypes.map((ft) => (
                <button
                  key={ft}
                  type="button"
                  className={`db-chip ${
                    selectedFileType === ft ? "db-chip-active" : ""
                  }`}
                  onClick={() => setSelectedFileType(ft)}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-filter-row second">
          <div className="db-filter-group wide">
            <label className="db-filter-label">Search assets</label>
            <input
              type="text"
              className="db-filter-input"
              placeholder="Search by document title or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="db-summary-group">
            <div className="db-summary-pill">
              <span className="db-summary-label">Total Assets</span>
              <span className="db-summary-value">{datasets.length}</span>
            </div>
            <div className="db-summary-pill">
              <span className="db-summary-label">Matching View</span>
              <span className="db-summary-value">
                {groups.reduce((acc, g) => acc + g.items.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* MODERN CARD VIEW OF SOURCES */}
      {loadingDatasets ? (
        <div
          style={{
            padding: 20,
            fontSize: "0.95rem",
            color: "#64748b",
          }}
        >
          Loading data sources...
        </div>
      ) : (
        <div className="db-source-grid">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className={`db-source-card ${
                source.status === "Online" ? "db-card-online" : "db-card-offline"
              }`}
            >
              <div className="db-card-header">
                <div className="db-card-icon-wrap">
                  <div className="db-card-icon">
                    <Icons.Database />
                  </div>
                </div>
                <div className="db-card-title-block">
                  <div className="db-card-title">{source.name}</div>
                  <div className="db-card-subtitle">
                    Data source for knowledge assets
                  </div>
                </div>
              </div>

              <div className="db-card-meta">
                <span
                  className={`db-status-pill ${
                    source.status === "Online"
                      ? "db-status-online"
                      : "db-status-offline"
                  }`}
                >
                  <span className="db-status-dot" />
                  {source.status}
                </span>
                <span className="db-time-pill">
                  <Icons.Clock /> Last sync: {source.lastSync}
                </span>
              </div>

              <div className="db-card-footer">
                {source.group ? (
                  <button
                    className="db-ghost-btn"
                    onClick={() => handleConfigure(source.group)}
                  >
                    <span>Configure &amp; Explore</span>
                    <Icons.ChevronRight />
                  </button>
                ) : (
                  <button className="db-ghost-btn" disabled>
                    <span>No Assets</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GROUP DIALOG: LIST FILES FOR THAT SUB-PRACTICE + FILETYPE */}
      {activeGroup && (
        <div className="db-modal-backdrop">
          <div className="db-modal">
            <div className="db-modal-header">
              <h3>
                {getFileTypeIcon(activeGroup.fileType)}{" "}
                <span style={{ marginLeft: 6 }}>
                  {activeGroup.subPractice} – {activeGroup.fileType} Files
                </span>
              </h3>
              <button
                className="db-modal-close"
                onClick={() => setActiveGroup(null)}
              >
                ×
              </button>
            </div>
            <div className="db-modal-body">
              {activeGroup.items.length === 0 ? (
                <div className="db-empty">
                  No files available for this group.
                </div>
              ) : (
                <table className="db-file-table">
                  <thead>
                    <tr>
                      <th>Document Title</th>
                      <th>Original File</th>
                      <th>Rows (if Excel)</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.items.map((ds) => (
                      <tr key={ds._id}>
                        <td>{ds.metadata?.tableName || "-"}</td>
                        <td>{ds.name}</td>
                        <td>
                          {isExcelType(ds)
                            ? ds.metadata?.totalRows ?? "0"
                            : "-"}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {/* Doc types: only View */}
                          {isDocType(ds) && (
                            <button
                              className="small-btn db-icon-btn"
                              onClick={() => openDocView(ds)}
                            >
                              <Icons.Play /> <span>View</span>
                            </button>
                          )}

                          {/* Excel types: View + Edit */}
                          {isExcelType(ds) && (
                            <>
                              <button
                                className="small-btn db-icon-btn"
                                onClick={() => openExcelView(ds, false)}
                              >
                                <Icons.Play /> <span>View</span>
                              </button>
                              <button
                                className="small-btn db-icon-btn"
                                style={{ marginLeft: 8 }}
                                onClick={() => openExcelView(ds, true)}
                              >
                                ✏️ <span>Edit</span>
                              </button>
                            </>
                          )}

                          {/* Other types: fallback View if they have a stored file */}
                          {!isDocType(ds) &&
                            !isExcelType(ds) &&
                            ds.filePath && (
                              <button
                                className="small-btn db-icon-btn"
                                onClick={() => openDocView(ds)}
                              >
                                <Icons.Play /> <span>View</span>
                              </button>
                            )}

                          {/* 🔹 VisionIQ summary button for ALL files */}
                          <button
                            className="small-btn db-icon-btn"
                            style={{ marginLeft: 8 }}
                            onClick={() => openVisionSummary(ds)}
                          >
                            <Icons.Sparkles />{" "}
                            <span>VisionIQ Summary</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Simple modal styling */}
          <style>{`
            .db-modal-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 90;
            }
            .db-modal {
              width: 80%;
              max-width: 900px;
              max-height: 80vh;
              background: #0f172a;
              color: #e2e8f0;
              border-radius: 16px;
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              animation: db-modal-pop 0.2s ease-out;
            }
            @keyframes db-modal-pop {
              from { opacity: 0; transform: translateY(10px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .db-modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 20px;
              border-bottom: 1px solid rgba(148, 163, 184, 0.3);
              background: rgba(15, 23, 42, 0.9);
            }
            .db-modal-header h3 {
              margin: 0;
              font-size: 1.05rem;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .db-modal-close {
              background: none;
              border: none;
              color: #94a3b8;
              font-size: 1.4rem;
              cursor: pointer;
            }
            .db-modal-body {
              padding: 16px 20px;
              overflow: auto;
            }
            .db-file-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
            }
            .db-file-table th,
            .db-file-table td {
              padding: 8px 10px;
              border-bottom: 1px solid rgba(148, 163, 184, 0.2);
              text-align: left;
            }
            .db-empty {
              padding: 20px;
              text-align: center;
              color: #94a3b8;
              font-size: 0.9rem;
            }
          `}</style>
        </div>
      )}

      {/* VIEW / EDIT DIALOG */}
      {viewDialog && (
        <div className="db-modal-backdrop">
          <div className="db-modal db-modal-large">
            <div className="db-modal-header">
              <h3>
                {viewDialog.dataset.metadata?.tableName ||
                  viewDialog.dataset.name}
                {" – "}
                {viewDialog.mode === "doc"
                  ? "Document Viewer"
                  : viewDialog.mode === "excel-view"
                  ? "Excel Preview"
                  : "Excel Editor"}
              </h3>
              <button
                className="db-modal-close"
                onClick={() => {
                  setViewDialog(null);
                  setActiveSheetIndex(0);
                }}
              >
                ×
              </button>
            </div>

            <div className="db-modal-body">
              {/* DOC VIEW (PDF/PPT/DOC) */}
              {viewDialog.mode === "doc" && (
                <iframe
                  title="Document Viewer"
                  src={`http://localhost:5000/api/files/${viewDialog.dataset._id}/stream`}
                  style={{
                    width: "100%",
                    height: "70vh",
                    borderRadius: 8,
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    background: "#020617",
                  }}
                  onLoad={() => setLoadingData(false)}
                  onError={() => setLoadingData(false)}
                />
              )}

              {/* EXCEL VIEW / EDIT (multi-sheet aware) */}
              {(viewDialog.mode === "excel-view" ||
                viewDialog.mode === "excel-edit") &&
                (() => {
                  const isMultiSheet =
                    Array.isArray(viewDialog.sheets) &&
                    viewDialog.sheets.length > 0;

                  const activeSheet = isMultiSheet
                    ? viewDialog.sheets[activeSheetIndex] ||
                      viewDialog.sheets[0]
                    : null;

                  const columns = isMultiSheet
                    ? activeSheet?.columns || []
                    : viewDialog.columns || [];

                  const rows = isMultiSheet
                    ? activeSheet?.rows || []
                    : viewDialog.rows || [];

                  const totalRows = isMultiSheet
                    ? activeSheet?.totalRows ?? rows.length
                    : viewDialog.dataset.metadata?.totalRows ?? rows.length;

                  return (
                    <>
                      {/* Sheet selector for multi-sheet workbooks */}
                      {isMultiSheet && (
                        <div
                          style={{
                            marginBottom: 8,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          {viewDialog.sheets.map((s, idx) => (
                            <button
                              key={s.name || idx}
                              type="button"
                              onClick={() => setActiveSheetIndex(idx)}
                              style={{
                                borderRadius: 999,
                                padding: "4px 10px",
                                fontSize: "0.78rem",
                                border:
                                  idx === activeSheetIndex
                                    ? "1px solid #6366f1"
                                    : "1px solid rgba(148,163,184,0.5)",
                                background:
                                  idx === activeSheetIndex
                                    ? "rgba(79,70,229,0.25)"
                                    : "rgba(15,23,42,0.9)",
                                color: "#e5e7eb",
                                cursor: "pointer",
                              }}
                            >
                              {s.name || `Sheet ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          marginBottom: 8,
                        }}
                      >
                        {isMultiSheet && (
                          <>
                            Sheet:{" "}
                            <strong>
                              {activeSheet?.name ||
                                `Sheet ${activeSheetIndex + 1}`}
                            </strong>{" "}
                            ·{" "}
                          </>
                        )}
                        Showing up to {rows?.length || 0} rows. Total rows:{" "}
                        {totalRows}
                      </div>

                      <div
                        style={{
                          borderRadius: 8,
                          border: "1px solid rgba(148, 163, 184, 0.4)",
                          overflow: "auto",
                          maxHeight: "65vh",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.8rem",
                          }}
                        >
                          <thead>
                            <tr>
                              {columns?.map((c) => (
                                <th
                                  key={c}
                                  style={{
                                    padding: "6px 8px",
                                    borderBottom:
                                      "1px solid rgba(148, 163, 184, 0.4)",
                                    textAlign: "left",
                                    position: "sticky",
                                    top: 0,
                                    background: "#020617",
                                    zIndex: 1,
                                  }}
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows?.map((row, idx) => (
                              <tr key={idx}>
                                {columns?.map((c) => (
                                  <td
                                    key={c}
                                    style={{
                                      padding: "4px 8px",
                                      borderBottom:
                                        "1px solid rgba(148, 163, 184, 0.15)",
                                      maxWidth: 200,
                                    }}
                                  >
                                    {viewDialog.mode === "excel-edit" ? (
                                      <input
                                        value={
                                          row[c] !== undefined &&
                                          row[c] !== null
                                            ? String(row[c])
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleExcelCellChange(
                                            idx,
                                            c,
                                            e.target.value
                                          )
                                        }
                                        style={{
                                          width: "100%",
                                          borderRadius: 4,
                                          border:
                                            "1px solid rgba(148, 163, 184, 0.4)",
                                          background: "#020617",
                                          color: "#e2e8f0",
                                          fontSize: "0.8rem",
                                          padding: "2px 4px",
                                        }}
                                      />
                                    ) : (
                                      <span
                                        style={{
                                          display: "inline-block",
                                          maxWidth: "100%",
                                          whiteSpace: "nowrap",
                                          textOverflow: "ellipsis",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {row[c] !== undefined &&
                                        row[c] !== null
                                          ? String(row[c])
                                          : ""}
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {viewDialog.mode === "excel-edit" && (
                        <div
                          style={{
                            marginTop: 12,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 10,
                          }}
                        >
                          <button
                            className="small-btn"
                            style={{
                              background: "#4b5563",
                              color: "white",
                            }}
                            onClick={() => {
                              setViewDialog(null);
                              setActiveSheetIndex(0);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="small-btn"
                            style={{
                              background:
                                "linear-gradient(135deg, #22c55e, #16a34a)",
                              color: "white",
                            }}
                            onClick={handleSaveExcel}
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
            </div>
          </div>

          {/* Additional modal styles for large mode */}
          <style>{`
            .db-modal-large {
              max-width: 1100px;
              width: 90%;
            }
          `}</style>
        </div>
      )}

      {/* 🔹 VISIONIQ SUMMARY DIALOG */}
      {visionDialog && (
        <div className="db-modal-backdrop">
          <div className="db-modal db-modal-large">
            <div className="db-modal-header">
              <h3>
                <Icons.Sparkles />{" "}
                <span style={{ marginLeft: 6 }}>
                  VisionIQ Summary –{" "}
                  {visionDialog.dataset.metadata?.tableName ||
                    visionDialog.dataset.name}
                </span>
              </h3>
              <button className="db-modal-close" onClick={closeVisionDialog}>
                ×
              </button>
            </div>
            <div className="db-modal-body">
              <div
                style={{
                  marginBottom: 10,
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                AI analysis powered by local Ollama model{" "}
                <code>qwen2.5:3b</code>. Summarizing file content + metadata
                into consultant-style insights.
              </div>

              {visionError && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#fecaca",
                    fontSize: "0.8rem",
                  }}
                >
                  {visionError}
                </div>
              )}

              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.9)",
                  padding: 12,
                  minHeight: 120,
                  maxHeight: "60vh",
                  overflow: "auto",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  color: "#e5e7eb",
                  whiteSpace: "pre-wrap",
                }}
              >
                {visionLoading
                  ? "VisionIQ is analyzing this file... ⏳"
                  : visionDialog.answer || "No response received from VisionIQ."}
              </div>
            </div>
          </div>
          <style>{`
            .db-modal-large {
              max-width: 900px;
              width: 90%;
            }
          `}</style>
        </div>
      )}

      {/* ADVANCED LOADING OVERLAY FOR BIG DOC/EXCEL OPS */}
      {loadingData && (
        <div className="db-loading-overlay">
          <div className="db-loading-card">
            <div className="db-loader-orbit">
              <div className="db-loader-center"></div>
              <div className="db-loader-dot db-dot-1"></div>
              <div className="db-loader-dot db-dot-2"></div>
              <div className="db-loader-dot db-dot-3"></div>
            </div>
            <div className="db-loading-text">
              <div className="db-loading-title">
                Processing large knowledge asset...
              </div>
              <div className="db-loading-sub">
                This is a large database. Please wait while we prepare your
                view. ⚙️
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + cards + loader styles */}
      <style>{`
        .db-filter-bar {
          margin: 18px 0 14px 0;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.4);
        }

        .db-filter-row {
          display: flex;
          gap: 18px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .db-filter-row.second {
          margin-top: 12px;
          align-items: center;
        }

        .db-filter-group {
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .db-filter-group.wide {
          flex: 1;
          min-width: 260px;
        }

        .db-filter-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9ca3af;
        }

        .db-filter-select {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15,23,42,0.8);
          color: #e5e7eb;
          font-size: 0.85rem;
          outline: none;
        }
        .db-filter-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.3);
        }

        .db-filter-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15,23,42,0.8);
          color: #e5e7eb;
          font-size: 0.85rem;
          outline: none;
        }
        .db-filter-input::placeholder {
          color: #6b7280;
        }
        .db-filter-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.3);
        }

        .db-type-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .db-chip {
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid rgba(148,163,184,0.4);
          background: transparent;
          color: #e5e7eb;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .db-chip:hover {
          border-color: #6366f1;
        }
        .db-chip-active {
          background: rgba(99,102,241,0.18);
          border-color: #6366f1;
          box-shadow: 0 0 0 1px rgba(129,140,248,0.4);
        }

        .db-summary-group {
          display: flex;
          gap: 10px;
          align-items: stretch;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .db-summary-pill {
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.4);
          background: rgba(15,23,42,0.9);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #e5e7eb;
        }
        .db-summary-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.7rem;
          color: #9ca3af;
        }
        .db-summary-value {
          font-weight: 600;
        }

        /* Card grid */
        .db-source-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }

        .db-source-card {
          background: rgba(15,23,42,0.9);
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.3);
          padding: 14px 14px 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(15,23,42,0.7);
          transform-origin: center;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .db-source-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(15,23,42,0.9);
          border-color: #6366f1;
        }
        .db-card-online {
          box-shadow: 0 10px 24px rgba(22, 163, 74, 0.2);
        }
        .db-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .db-card-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(129,140,248,0.25), rgba(15,23,42,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a5b4fc;
        }
        .db-card-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .db-card-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #e5e7eb;
        }
        .db-card-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .db-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .db-status-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .db-status-online {
          background: rgba(22,163,74,0.16);
          color: #4ade80;
          border: 1px solid rgba(22,163,74,0.6);
        }
        .db-status-offline {
          background: rgba(239,68,68,0.16);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.6);
        }
        .db-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: currentColor;
        }

        .db-time-pill {
          font-size: 0.75rem;
          color: #9ca3af;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .db-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .db-ghost-btn {
          border-radius: 999px;
          border: 1px solid rgba(99,102,241,0.7);
          background: radial-gradient(circle at top left, rgba(59,130,246,0.35), rgba(15,23,42,1));
          color: #e5e7eb;
          font-size: 0.78rem;
          padding: 6px 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        }
        .db-ghost-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(59,130,246,0.4);
        }
        .db-ghost-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .db-icon-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding-inline: 10px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .db-icon-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,23,42,0.6);
        }

        @media (max-width: 800px) {
          .db-filter-bar {
            padding: 12px;
          }
          .db-summary-group {
            justify-content: flex-start;
          }
        }

        .db-loading-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top, rgba(37, 99, 235,0.2), rgba(15, 23, 42,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }
        .db-loading-card {
          background: rgba(15,23,42,0.95);
          border-radius: 20px;
          padding: 24px 30px;
          display: flex;
          align-items: center;
          gap: 18px;
          border: 1px solid rgba(148,163,184,0.4);
          box-shadow: 0 25px 60px rgba(0,0,0,0.7);
        }
        .db-loader-orbit {
          position: relative;
          width: 64px;
          height: 64px;
        }
        .db-loader-center {
          position: absolute;
          inset: 18px;
          border-radius: 999px;
          background: radial-gradient(circle, #38bdf8, #1d4ed8);
          box-shadow: 0 0 18px rgba(56,189,248,0.7);
        }
        .db-loader-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #e5e7eb;
          box-shadow: 0 0 12px rgba(248,250,252,0.6);
          animation: db-orbit 2s linear infinite;
        }
        .db-dot-1 { top: 0; left: 50%; margin-left: -5px; animation-delay: 0s; }
        .db-dot-2 { right: 0; top: 50%; margin-top: -5px; animation-delay: 0.3s; }
        .db-dot-3 { bottom: 0; left: 50%; margin-left: -5px; animation-delay: 0.6s; }

        @keyframes db-orbit {
          0% { transform: rotate(0deg) translateX(16px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(16px) rotate(-360deg); }
        }

        .db-loading-text {
          color: #e5e7eb;
        }
        .db-loading-title {
          font-size: 0.98rem;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .db-loading-sub {
          font-size: 0.85rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default Databases;
