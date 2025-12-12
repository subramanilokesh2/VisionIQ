// CompanyProfile.jsx
import React, { useState, useEffect } from "react";

const CompanyProfile = () => {
  const [company, setCompany] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [industry, setIndustry] = useState("");
  const [vertical, setVertical] = useState("");
  const [extraContext, setExtraContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState("");
  const [error, setError] = useState("");
  const [structured, setStructured] = useState(null);

  // 🔥 5-step animated pipeline state
  const loadingSteps = [
    "Locking in company & filters…",
    "Fetching relevant Zinnov Signals from DB…",
    "Clustering & prioritizing signals by theme…",
    "Asking local VisionIQ model to draft the profile…",
    "Structuring output into consulting-style sections…",
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!loading) return;

    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % loadingSteps.length);
    }, 900); // animate every 0.9s

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setProfile("");
    setStructured(null);

    if (!company.trim()) {
      setError("Please enter a company name.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/visioniq/company-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company: company.trim(),
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            industry: industry || undefined,
            vertical: vertical || undefined,
            extraContext: extraContext || undefined,
            // 🔓 allow general knowledge so structured info can be populated
            allowGeneralKnowledge: true,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to generate profile");
      }

      setProfile(data.profile || "");
      setStructured(data.structured || null);
    } catch (err) {
      console.error("Company profile error:", err);
      setError(err.message || "Unexpected error while generating profile.");
    } finally {
      setLoading(false);
    }
  };

  const renderStructuredBasics = () => {
    if (!structured) return null;

    const {
      companyName,
      website,
      companyLinkedin,
      headquarters,
      foundedYear,
      totalHeadcountApprox,
      industryVerticals,
    } = structured;

    return (
      <div className="cp-struct-grid">
        {/* Basic identity */}
        <div className="cp-struct-card">
          <h4>Company Basics</h4>
          <ul>
            <li>
              <span className="cp-label">Name:</span>{" "}
              <span>{companyName || company || "–"}</span>
            </li>
            <li>
              <span className="cp-label">Headquarters:</span>{" "}
              <span>{headquarters || "–"}</span>
            </li>
            <li>
              <span className="cp-label">Founded:</span>{" "}
              <span>{foundedYear || "–"}</span>
            </li>
            <li>
              <span className="cp-label">Total Headcount:</span>{" "}
              <span>{totalHeadcountApprox || "–"}</span>
            </li>
          </ul>
          <div className="cp-links-row">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="cp-chip-link"
              >
                Website
              </a>
            )}
            {companyLinkedin && (
              <a
                href={companyLinkedin}
                target="_blank"
                rel="noreferrer"
                className="cp-chip-link"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Verticals */}
        <div className="cp-struct-card">
          <h4>Industry Verticals</h4>
          {industryVerticals && industryVerticals.length > 0 ? (
            <div className="cp-chip-row">
              {industryVerticals.map((v, i) => (
                <span key={i} className="cp-chip">
                  {v}
                </span>
              ))}
            </div>
          ) : (
            <div className="cp-muted">Not specified</div>
          )}
        </div>
      </div>
    );
  };

  const renderStructuredProductsServices = () => {
    if (!structured) return null;

    const { products, services } = structured;

    if (
      (!products || products.length === 0) &&
      (!services || services.length === 0)
    ) {
      return null;
    }

    return (
      <div className="cp-struct-grid">
        <div className="cp-struct-card">
          <h4>Key Products</h4>
          {products && products.length > 0 ? (
            <ul className="cp-list-compact">
              {products.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <div className="cp-muted">No product list captured.</div>
          )}
        </div>
        <div className="cp-struct-card">
          <h4>Key Services</h4>
          {services && services.length > 0 ? (
            <ul className="cp-list-compact">
              {services.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <div className="cp-muted">No service list captured.</div>
          )}
        </div>
      </div>
    );
  };

  const renderStructuredFinancials = () => {
    if (!structured) return null;

    const { latestRevenue, last3YearsRevenue } = structured;

    const hasLatest =
      latestRevenue && (latestRevenue.value || latestRevenue.year);
    const hasHistory =
      last3YearsRevenue && Array.isArray(last3YearsRevenue) && last3YearsRevenue.length > 0;

    if (!hasLatest && !hasHistory) return null;

    return (
      <div className="cp-struct-card cp-struct-card-full">
        <h4>Financial Snapshot</h4>
        {hasLatest && (
          <div className="cp-fin-latest">
            <span className="cp-label">Latest Revenue:</span>
            <span>
              {latestRevenue.value || "–"}{" "}
              {latestRevenue.currency ? latestRevenue.currency : ""}
              {latestRevenue.year ? ` (FY ${latestRevenue.year})` : ""}
            </span>
            {latestRevenue.note && (
              <div className="cp-muted" style={{ marginTop: 2 }}>
                {latestRevenue.note}
              </div>
            )}
          </div>
        )}

        {hasHistory && (
          <div className="cp-fin-table-wrap">
            <table className="cp-fin-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>Currency</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {last3YearsRevenue.map((row, i) => (
                  <tr key={i}>
                    <td>{row.year || "–"}</td>
                    <td>{row.value || "–"}</td>
                    <td>{row.currency || "–"}</td>
                    <td>{row.note || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderStructuredLeadership = () => {
    if (!structured) return null;

    const { leadership } = structured;

    if (!leadership || leadership.length === 0) return null;

    return (
      <div className="cp-struct-card cp-struct-card-full">
        <h4>Key Leadership</h4>
        <div className="cp-leadership-grid">
          {leadership.map((leader, idx) => (
            <div key={idx} className="cp-leader-pill">
              <div className="cp-leader-name">{leader.name || "Unknown"}</div>
              <div className="cp-leader-role">{leader.role || "–"}</div>
              {leader.linkedin && (
                <a
                  href={leader.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="cp-chip-link small"
                >
                  LinkedIn
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container fade-in-up">
      <h2>VisionIQ – Company Profile Generator</h2>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Generate a consulting-style profile for a target company using Zinnov
        Signals + VisionIQ. Structured basics, financials, products, and
        leadership are extracted for analyst-ready views.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 400px) minmax(0, 1fr)",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* Form card */}
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.4)",
            boxShadow: "0 12px 30px rgba(15,23,42,0.8)",
          }}
        >
          <form onSubmit={handleGenerate} className="cp-form">
            <div className="cp-field">
              <label>Company Name *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., UiPath, Google, Accenture"
              />
            </div>

            <div className="cp-two-cols">
              <div className="cp-field">
                <label>From Date (optional)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="cp-field">
                <label>To Date (optional)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="cp-two-cols">
              <div className="cp-field">
                <label>Industry (optional)</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Semiconductors, Automotive"
                />
              </div>
              <div className="cp-field">
                <label>Vertical (optional)</label>
                <input
                  type="text"
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  placeholder="e.g., ER&D, FinTech"
                />
              </div>
            </div>

            <div className="cp-field">
              <label>Additional context (optional)</label>
              <textarea
                rows={3}
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="Any extra instructions or context for VisionIQ..."
              />
            </div>

            {error && <div className="cp-error">{error}</div>}

            <button
              type="submit"
              className="cp-btn-primary"
              disabled={loading}
            >
              {loading ? "Generating profile..." : "Generate Company Profile"}
            </button>
          </form>
        </div>

        {/* Output card */}
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.4)",
            boxShadow: "0 12px 30px rgba(15,23,42,0.8)",
            minHeight: 240,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
              Generated Profile
            </h3>
            {(profile || structured) && (
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  color: "#e5e7eb",
                }}
              >
                VisionIQ · {company || "Company"}
              </span>
            )}
          </div>

          {/* Idle state */}
          {!profile && !structured && !loading && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
              }}
            >
              Run a profile to see company basics, scale, financials, leadership
              and a markdown summary here.
            </div>
          )}

          {/* 🔥 5-step animated loading pipeline */}
          {loading && (
            <div className="cp-loading-container">
              <div className="cp-loading-header">
                <div className="cp-spinner" />
                <span>VisionIQ is synthesizing your company profile…</span>
              </div>

              <div className="cp-steps">
                {loadingSteps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  const isCompleted =
                    !isActive &&
                    // treat previous indices as "completed" purely visually
                    (activeStep === loadingSteps.length - 1
                      ? idx !== activeStep
                      : idx < activeStep);

                  return (
                    <div
                      key={idx}
                      className={`cp-step ${
                        isCompleted ? "completed" : ""
                      } ${isActive ? "active" : ""}`}
                    >
                      <div className="cp-step-badge">
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div className="cp-step-text">{step}</div>
                      {isActive && <div className="cp-step-pulse" />}
                    </div>
                  );
                })}
              </div>

              <div className="cp-loading-bar">
                <div
                  className="cp-loading-bar-inner"
                  style={{
                    width: `${((activeStep + 1) / loadingSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Structured summary cards */}
          {!loading && structured && (
            <div className="cp-struct-wrapper">
              {renderStructuredBasics()}
              {renderStructuredFinancials()}
              {renderStructuredProductsServices()}
              {renderStructuredLeadership()}
            </div>
          )}

          {/* Markdown profile */}
          {profile && (
            <pre
              style={{
                marginTop: 12,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontSize: "0.8rem",
                color: "#e5e7eb",
                flex: 1,
                overflowY: "auto",
                maxHeight: "50vh",
              }}
            >
              {profile}
            </pre>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .cp-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cp-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cp-field label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9ca3af;
        }
        .cp-field input,
        .cp-field textarea {
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.6);
          background: rgba(15,23,42,0.85);
          color: #e5e7eb;
          padding: 6px 8px;
          font-size: 0.85rem;
          outline: none;
        }
        .cp-field input:focus,
        .cp-field textarea:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4);
        }
        .cp-two-cols {
          display: flex;
          gap: 10px;
        }
        .cp-two-cols .cp-field {
          flex: 1;
        }
        .cp-btn-primary {
          margin-top: 6px;
          border-radius: 999px;
          border: 1px solid rgba(129,140,248,0.8);
          background: linear-gradient(135deg, #4f46e5, #22c55e);
          color: white;
          padding: 8px 14px;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
        }
        .cp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cp-btn-primary:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(22,163,74,0.4);
        }
        .cp-error {
          margin-top: 4px;
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
          font-size: 0.78rem;
        }

        /* 🔥 Loading UI */
        .cp-loading-container {
          margin-top: 4px;
          padding: 10px 10px 6px;
          border-radius: 12px;
          background: radial-gradient(circle at top left, rgba(99,102,241,0.25), transparent 50%),
                      radial-gradient(circle at bottom right, rgba(34,197,94,0.15), transparent 50%);
          border: 1px solid rgba(129,140,248,0.5);
          animation: cpFadeIn 0.25s ease-out;
        }
        .cp-loading-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #e5e7eb;
          margin-bottom: 8px;
        }
        .cp-spinner {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(129,140,248,0.4);
          border-top-color: #a855f7;
          animation: cpSpin 0.7s linear infinite;
        }
        .cp-steps {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
          margin-bottom: 8px;
        }
        .cp-step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #cbd5f5;
          opacity: 0.55;
          transform: translateX(0);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .cp-step.active {
          opacity: 1;
          transform: translateX(2px);
        }
        .cp-step.completed {
          opacity: 0.8;
        }
        .cp-step-badge {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          border: 1px solid rgba(148,163,184,0.7);
          background: rgba(15,23,42,0.9);
        }
        .cp-step.active .cp-step-badge {
          border-color: #a855f7;
          background: radial-gradient(circle, #4f46e5, #22c55e);
          color: white;
        }
        .cp-step.completed .cp-step-badge {
          border-color: #22c55e;
          color: #22c55e;
        }
        .cp-step-text {
          flex: 1;
        }
        .cp-step-pulse {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #a855f7;
          box-shadow: 0 0 0 0 rgba(168,85,247,0.6);
          animation: cpPulse 1.1s ease-out infinite;
        }
        .cp-loading-bar {
          position: relative;
          height: 4px;
          border-radius: 999px;
          background: rgba(15,23,42,0.8);
          overflow: hidden;
        }
        .cp-loading-bar-inner {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #4f46e5, #a855f7, #22c55e);
          transition: width 0.25s ease-out;
        }

        /* Structured cards */
        .cp-struct-wrapper {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cp-struct-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cp-struct-card {
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.4);
          background: rgba(15,23,42,0.95);
          padding: 10px 12px;
        }
        .cp-struct-card-full {
          width: 100%;
        }
        .cp-struct-card h4 {
          margin: 0 0 6px 0;
          font-size: 0.85rem;
          color: #e5e7eb;
        }
        .cp-struct-card ul {
          margin: 0;
          padding-left: 16px;
          font-size: 0.78rem;
          color: #e5e7eb;
        }
        .cp-label {
          font-weight: 600;
          color: #9ca3af;
        }
        .cp-links-row {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cp-chip-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(129,140,248,0.7);
          font-size: 0.75rem;
          color: #e5e7eb;
          text-decoration: none;
          background: rgba(15,23,42,0.9);
        }
        .cp-chip-link.small {
          font-size: 0.7rem;
          padding: 3px 8px;
        }
        .cp-chip-link:hover {
          border-color: #6366f1;
        }
        .cp-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .cp-chip {
          border-radius: 999px;
          padding: 2px 9px;
          border: 1px solid rgba(148,163,184,0.6);
          font-size: 0.7rem;
          color: #e5e7eb;
        }
        .cp-muted {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .cp-list-compact {
          font-size: 0.78rem;
        }

        .cp-fin-latest {
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 6px;
        }
        .cp-fin-table-wrap {
          overflow-x: auto;
        }
        .cp-fin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
          margin-top: 4px;
        }
        .cp-fin-table th,
        .cp-fin-table td {
          border-bottom: 1px solid rgba(51,65,85,0.8);
          padding: 4px 6px;
          text-align: left;
        }
        .cp-fin-table th {
          color: #9ca3af;
          font-weight: 600;
        }

        .cp-leadership-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }
        .cp-leader-pill {
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.5);
          padding: 6px 8px;
          min-width: 140px;
          font-size: 0.75rem;
        }
        .cp-leader-name {
          font-weight: 600;
          color: #e5e7eb;
        }
        .cp-leader-role {
          color: #9ca3af;
          font-size: 0.7rem;
          margin-bottom: 4px;
        }

        @keyframes cpSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes cpPulse {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(168,85,247,0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(168,85,247,0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(168,85,247,0); }
        }
        @keyframes cpFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .page-container {
            padding: 10px;
          }
          .page-container > div {
            grid-template-columns: minmax(0,1fr) !important;
          }
          .cp-struct-grid {
            grid-template-columns: minmax(0,1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyProfile;
