// LiveSignals.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- ICONS ---
const Icons = {
  Signal: () => (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      className="icon-signal"
    >
      <path d="M12 2v20M17 5v14M7 9v6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Search: () => (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Zap: () => (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Download: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 20h16" />
      <polyline points="8 10 12 14 16 10" />
      <line x1="12" y1="4" x2="12" y2="14" />
    </svg>
  ),
  LayoutGrid: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  LayoutTable: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
};

const API_BASE = "http://localhost:5000";
const LOCAL_STORAGE_KEY = "liveSignalsFilters_v1";

// Static industry and vertical options (can be expanded as needed)
const INDUSTRY_OPTIONS = [
  "All",
  "Technology",
  "Semiconductors",
  "Automotive",
  "Manufacturing",
  "Healthcare & Life Sciences",
  "Retail & Consumer",
  "Financial Services",
  "Telecom & Media",
  "Energy & Utilities",
  "Others",
];

const VERTICAL_OPTIONS = [
  "All",
  "Cloud & Infrastructure",
  "AI & Analytics",
  "Engineering R&D",
  "Customer Experience",
  "Supply Chain",
  "Cybersecurity",
  "Auto & Mobility",
  "FinTech",
  "HealthTech",
  "Others",
];

const LiveSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusLoading, setFocusLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  // raw input (for debouncing)
  const [searchInput, setSearchInput] = useState("");
  // debounced value actually used in API calls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [verticalFilter, setVerticalFilter] = useState("All");
  const [onlyMA, setOnlyMA] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  const [uniqueCategories, setUniqueCategories] = useState(["All"]);
  const [uniqueIndustries, setUniqueIndustries] =
    useState(INDUSTRY_OPTIONS);
  const [uniqueVerticals, setUniqueVerticals] =
    useState(VERTICAL_OPTIONS);
  const [uniqueCompanies, setUniqueCompanies] = useState([]);

  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // meta for company-focus mode
  const [focusMeta, setFocusMeta] = useState(null); // { company, fromDate, toDate }

  // ----------------------------------------
  // Restore filters & view mode from localStorage
  // ----------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed.searchQuery !== undefined) {
        setSearchQuery(parsed.searchQuery);
        setSearchInput(parsed.searchQuery);
      }
      if (parsed.selectedCategory !== undefined)
        setSelectedCategory(parsed.selectedCategory);
      if (parsed.selectedSeverity !== undefined)
        setSelectedSeverity(parsed.selectedSeverity);
      if (parsed.fromDate !== undefined) setFromDate(parsed.fromDate);
      if (parsed.toDate !== undefined) setToDate(parsed.toDate);
      if (parsed.companyFilter !== undefined)
        setCompanyFilter(parsed.companyFilter);
      if (parsed.industryFilter !== undefined)
        setIndustryFilter(parsed.industryFilter);
      if (parsed.verticalFilter !== undefined)
        setVerticalFilter(parsed.verticalFilter);
      if (parsed.onlyMA !== undefined) setOnlyMA(parsed.onlyMA);
      if (parsed.viewMode !== undefined) setViewMode(parsed.viewMode);
    } catch (e) {
      console.error("Failed to restore filters from localStorage:", e);
    }
  }, []);

  // ----------------------------------------
  // Persist filters & view mode to localStorage
  // ----------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      searchQuery,
      selectedCategory,
      selectedSeverity,
      fromDate,
      toDate,
      companyFilter,
      industryFilter,
      verticalFilter,
      onlyMA,
      viewMode,
    };

    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch (e) {
      console.error("Failed to persist filters to localStorage:", e);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedSeverity,
    fromDate,
    toDate,
    companyFilter,
    industryFilter,
    verticalFilter,
    onlyMA,
    viewMode,
  ]);

  // ----------------------------------------
  // Debounce search input -> searchQuery
  // ----------------------------------------
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400); // 400ms debounce

    return () => clearTimeout(id);
  }, [searchInput]);

  // --- Fetch with filters from backend ---
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFocusMeta(null); // resetting focus banner when normal fetch runs

    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);

      // Category logic: if onlyMA is on, override with M&A
      if (onlyMA) {
        params.append("category", "M&A");
      } else if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }

      if (selectedSeverity !== "All")
        params.append("severity", selectedSeverity);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (companyFilter) params.append("company", companyFilter);
      if (industryFilter !== "All")
        params.append("industry", industryFilter);
      if (verticalFilter !== "All")
        params.append("vertical", verticalFilter);

      // Analysts typically want all; keep a high safety cap
      params.append("limit", "1000");

      const url = `${API_BASE}/api/signals?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const fetchedSignals = data.signals || [];

      setSignals(fetchedSignals);

      // Build filter options from data + static options
      const categories = new Set(["All"]);
      const industries = new Set(INDUSTRY_OPTIONS);
      const verticals = new Set(VERTICAL_OPTIONS);
      const companies = new Set();

      fetchedSignals.forEach((s) => {
        if (s.category) categories.add(s.category);
        if (s.industry) industries.add(s.industry);
        if (s.vertical) verticals.add(s.vertical);
        if (s.company) companies.add(s.company);
      });

      setUniqueCategories(Array.from(categories));
      setUniqueIndustries(Array.from(industries));
      setUniqueVerticals(Array.from(verticals));
      setUniqueCompanies(Array.from(companies).sort());

      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error("Fetch signals failed:", err);
      setError("Failed to load signals.");
      toast.error("❌ Failed to load signals workspace.");
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedSeverity,
    fromDate,
    toDate,
    companyFilter,
    industryFilter,
    verticalFilter,
    onlyMA,
  ]);

  // Initial load + whenever filters change (with debounced searchQuery)
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Auto refresh every 8 hours on the frontend too (extra safety)
  useEffect(() => {
    const eightHoursMs = 8 * 60 * 60 * 1000;
    const id = setInterval(() => {
      fetchSignals();
    }, eightHoursMs);
    return () => clearInterval(id);
  }, [fetchSignals]);

  const filteredSignals = useMemo(() => {
    // backend already filtered, just sort
    return [...signals].sort(
      (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
    );
  }, [signals]);

  // Extended: VisionIQ now also logs to backend (invisible to UI)
  const handleVisionIQQuery = useCallback(async (title) => {
    toast.info(`🤖 VisionIQ is analyzing: "${title}"`);
    try {
      await fetch(`${API_BASE}/api/signals/visioniq-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } catch (err) {
      // Non-blocking log error
      console.error("VisionIQ log error:", err);
    }
  }, []);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/api/signals/refresh`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Signals refreshed from News API.");
      } else {
        toast.warning("⚠️ Refresh completed with warnings.");
      }
      await fetchSignals();
    } catch (err) {
      console.error("Manual refresh error:", err);
      toast.error("❌ Error refreshing signals from API.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);

      if (onlyMA) {
        params.append("category", "M&A");
      } else if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }

      if (selectedSeverity !== "All")
        params.append("severity", selectedSeverity);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (companyFilter) params.append("company", companyFilter);
      if (industryFilter !== "All")
        params.append("industry", industryFilter);
      if (verticalFilter !== "All")
        params.append("vertical", verticalFilter);

      const url = `${API_BASE}/api/signals/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "zinnov_signals_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(href);

      toast.success("📥 CSV downloaded for current view.");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("❌ Error downloading CSV. Please try again.");
    }
  };

  const applyPreset = (preset) => {
    const now = new Date();
    if (preset === "7d") {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === "30d") {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === "ytd") {
      const from = new Date(now.getFullYear(), 0, 1);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === "clear") {
      setFromDate("");
      setToDate("");
    }
  };

  const formatLastRefreshed = () => {
    if (!lastRefreshedAt) return "N/A";
    return new Date(lastRefreshedAt).toLocaleString();
  };

  // advanced company-focus search
  const handleCompanyFocus = async () => {
    if (!companyFilter.trim()) {
      toast.warning("⚠️ Enter a company name first.");
      return;
    }
    if (!fromDate || !toDate) {
      toast.warning("⚠️ Select a From and To date.");
      return;
    }

    try {
      setFocusLoading(true);
      setError(null);

      const body = {
        company: companyFilter.trim(),
        fromDate,
        toDate,
      };

      const res = await fetch(`${API_BASE}/api/signals/company-focus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Company focus API failed");

      const data = await res.json();
      const list = data.signals || [];

      setSignals(list);
      setFocusMeta({
        company: companyFilter.trim(),
        fromDate,
        toDate,
        count: list.length,
      });

      toast.success(
        `🔍 Fetched ${list.length} live signals for ${body.company}.`
      );
    } catch (err) {
      console.error("Company focus error:", err);
      toast.error("❌ Error running company-focus search.");
    } finally {
      setFocusLoading(false);
    }
  };

  const renderCard = (signal, idx) => {
    const severityClass = `severity-${(signal.severity || "").toLowerCase()}`;
    const publishedDate = signal.publishedAt
      ? new Date(signal.publishedAt).toLocaleString()
      : "N/A";
    const truncatedDescription =
      signal.description && signal.description.length > 150
        ? signal.description.substring(0, 150) + "..."
        : signal.description || "No description available.";

    return (
      <div key={idx} className={`signal-card ${severityClass}`}>
        <div className="signal-header">
          <Icons.Signal />
          <span className={`signal-badge ${severityClass}`}>
            {signal.severity || "Unknown"}
          </span>
          {signal.company && (
            <span className="signal-chip signal-company">
              {signal.company}
            </span>
          )}
          {signal.industry && (
            <span className="signal-chip signal-industry">
              {signal.industry}
            </span>
          )}
          {signal.vertical && (
            <span className="signal-chip signal-vertical">
              {signal.vertical}
            </span>
          )}
          <span className="signal-source">
            {signal.source || "External"}
          </span>
        </div>
        <h3 className="signal-title">{signal.title}</h3>
        <p className="signal-category">
          Category: {signal.category || "General"}
        </p>
        <p className="signal-text">{truncatedDescription}</p>
        <div className="signal-footer">
          <time className="signal-date">Published: {publishedDate}</time>
          <div className="signal-actions">
            <a
              className="view-details-btn"
              href={signal.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Source <Icons.ArrowRight />
            </a>
            <button
              className="visioniq-btn pulse-effect"
              onClick={() => handleVisionIQQuery(signal.title)}
            >
              <Icons.Zap /> Ask VisionIQ
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="signals-table-wrapper">
      <table className="signals-table">
        <thead>
          <tr>
            <th>Published</th>
            <th>Company</th>
            <th>Title</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Industry</th>
            <th>Vertical</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {filteredSignals.map((s, i) => (
            <tr key={i}>
              <td>
                {s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>{s.company || "-"}</td>
              <td className="col-title">
                <a
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.title}
                </a>
              </td>
              <td>{s.category || "-"}</td>
              <td>{s.severity || "-"}</td>
              <td>{s.industry || "-"}</td>
              <td>{s.vertical || "-"}</td>
              <td>{s.source || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="live-signals-container">
      <style>{CSS_STYLES}</style>
      <ToastContainer position="bottom-right" theme="dark" />

      <header className="dashboard-header">
        <div className="header-main">
          <div>
            <h1>Live Strategy Signals Console</h1>
            <p className="text-muted">
              Analyst workspace for tracking M&A, funding, and strategic
              moves across industries.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() =>
                setViewMode(viewMode === "cards" ? "table" : "cards")
              }
            >
              {viewMode === "cards" ? (
                <Icons.LayoutTable />
              ) : (
                <Icons.LayoutGrid />
              )}
              <span>
                {viewMode === "cards" ? "Table View" : "Card View"}
              </span>
            </button>
            <button
              className="icon-btn"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <Icons.Refresh />
              <span>
                {refreshing ? "Refreshing..." : "Refresh Now"}
              </span>
            </button>
            <button className="icon-btn primary" onClick={handleDownload}>
              <Icons.Download />
              <span>Download View</span>
            </button>
          </div>
        </div>

        <div className="signal-stats">
          <div className="stat-item">
            Total Signals
            <span>{signals.length}</span>
          </div>
          <div className="stat-item">
            Showing
            <span>{filteredSignals.length}</span>
          </div>
          <div className="stat-item high-priority">
            Medium / High
            <span>
              {
                signals.filter(
                  (s) =>
                    s.severity === "Medium" || s.severity === "High"
                ).length
              }
            </span>
          </div>
          <div className="stat-item">
            Last Refreshed
            <span className="last-refreshed">
              {formatLastRefreshed()}
            </span>
          </div>
        </div>

        {focusMeta && (
          <div className="focus-banner">
            🎯 Focused on{" "}
            <strong>{focusMeta.company}</strong> from{" "}
            <strong>{focusMeta.fromDate}</strong> to{" "}
            <strong>{focusMeta.toDate}</strong> — {focusMeta.count} live
            signals from NewsAPI.
          </div>
        )}
      </header>

      {/* FILTER PANEL */}
      <div className="filter-bar">
        <div className="filter-row">
          <div className="search-box">
            <Icons.Search />
            <input
              type="text"
              placeholder="Search by title, description, company or source..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="select-box">
            <label>Category</label>
            <div className="select-inner">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Icons.ChevronDown />
            </div>
          </div>

          <div className="select-box">
            <label>Severity</label>
            <div className="select-inner">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="All">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <Icons.ChevronDown />
            </div>
          </div>

          <div className="toggle-ma">
            <label>
              <input
                type="checkbox"
                checked={onlyMA}
                onChange={(e) => setOnlyMA(e.target.checked)}
              />
              <span>Only M&A / Acquisitions</span>
            </label>
          </div>
        </div>

        {/* Date + Company / Industry / Vertical row */}
        <div className="filter-row second">
          <div className="date-range">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="preset-chips">
              <button onClick={() => applyPreset("7d")}>Last 7 days</button>
              <button onClick={() => applyPreset("30d")}>
                Last 30 days
              </button>
              <button onClick={() => applyPreset("ytd")}>YTD</button>
              <button onClick={() => applyPreset("clear")}>Clear</button>
            </div>
          </div>

          <div className="company-filter">
            <label>Target Company</label>
            <div className="company-input-row">
              <input
                type="text"
                placeholder="e.g., Microsoft, NVIDIA..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
              <button
                type="button"
                className="focus-btn"
                onClick={handleCompanyFocus}
                disabled={focusLoading}
              >
                {focusLoading ? "Focusing..." : "Focus on Company"}
              </button>
            </div>
            {uniqueCompanies.length > 0 && (
              <div className="company-chip-row">
                {uniqueCompanies.slice(0, 10).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`company-chip ${
                      companyFilter === c ? "active" : ""
                    }`}
                    onClick={() =>
                      setCompanyFilter(
                        companyFilter === c ? "" : c
                      )
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="select-box small">
            <label>Industry</label>
            <div className="select-inner">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                {uniqueIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              <Icons.ChevronDown />
            </div>
          </div>

          <div className="select-box small">
            <label>Vertical</label>
            <div className="select-inner">
              <select
                value={verticalFilter}
                onChange={(e) => setVerticalFilter(e.target.value)}
              >
                {uniqueVerticals.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <Icons.ChevronDown />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <p className="status-message loading">
          🚀 Loading signals workspace...
        </p>
      )}
      {error && (
        <p className="status-message error">❌ {error}</p>
      )}
      {!loading && !error && filteredSignals.length === 0 && (
        <p className="status-message no-results">
          🧐 No signals match the current filters. Adjust filters or run
          a company-focus search.
        </p>
      )}

      {viewMode === "cards" ? (
        <div className="signals-grid">
          {filteredSignals.map(renderCard)}
        </div>
      ) : (
        renderTable()
      )}
    </div>
  );
};

export default LiveSignals;

// --- CSS STYLES ---
const CSS_STYLES = `
:root {
  --bg-dark: #020617;
  --bg-card: #0f172a;
  --text-light: #f9fafb;
  --text-muted: #9ca3af;
  --accent-primary: #3b82f6;
  --accent-high: #ef4444;
  --accent-medium: #f59e0b;
  --accent-low: #10b981;
  --border-color: #1f2933;
}

.live-signals-container {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 1.75rem 1.25rem;
  background: radial-gradient(circle at top, #0b1120, #020617);
  color: var(--text-light);
  border-radius: 0.9rem;
  border: 1px solid rgba(148,163,184,0.2);
  box-shadow: 0 25px 60px rgba(15,23,42,0.9);
}

.dashboard-header {
  border-bottom: 1px solid rgba(148,163,184,0.25);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-header h1 {
  font-size: 1.85rem;
  color: var(--text-light);
  margin-bottom: 0.25rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.4);
  background: rgba(15,23,42,0.9);
  color: var(--text-light);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.16s ease;
}
.icon-btn svg { opacity: 0.85; }
.icon-btn:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 8px 18px rgba(37,99,235,0.4);
  transform: translateY(-1px);
}
.icon-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #22c55e);
  border-color: transparent;
}

.signal-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.1rem;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.35);
  background: rgba(15,23,42,0.8);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.stat-item span {
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 0.95rem;
}
.stat-item.high-priority span {
  color: var(--accent-high);
}
.last-refreshed {
  font-size: 0.75rem;
}

/* focus banner */
.focus-banner {
  margin-top: 0.8rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(37,99,235,0.12);
  border: 1px dashed rgba(37,99,235,0.6);
  font-size: 0.85rem;
}

/* FILTER BAR */
.filter-bar {
  margin: 16px 0 18px 0;
  padding: 14px 14px 12px 14px;
  border-radius: 12px;
  background: radial-gradient(circle at top left, rgba(37,99,235,0.25), rgba(15,23,42,0.98));
  border: 1px solid rgba(148,163,184,0.4);
  box-shadow: 0 18px 40px rgba(15,23,42,0.7);
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filter-row.second {
  margin-top: 10px;
  align-items: stretch;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1.1;
  min-width: 240px;
  background-color: rgba(15,23,42,0.9);
  border-radius: 0.45rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(148,163,184,0.6);
}
.search-box svg {
  margin-right: 0.55rem;
  color: var(--text-muted);
}
.search-box input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 0.9rem;
  padding: 0;
}
.search-box input:focus {
  outline: none;
}

.select-box {
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.select-box label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.select-inner {
  position: relative;
  background-color: rgba(15,23,42,0.9);
  border-radius: 0.4rem;
  border: 1px solid rgba(148,163,184,0.6);
}
.select-inner select {
  appearance: none;
  background: none;
  border: none;
  color: var(--text-light);
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  width: 100%;
  border-radius: 0.4rem;
}
/* 🔧 fix: make dropdown text visible */
.select-inner select option {
  background-color: #020617;
  color: var(--text-light);
}
.select-inner svg {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-muted);
}

.select-box.small {
  min-width: 130px;
}

.toggle-ma {
  display: flex;
  align-items: center;
  padding-bottom: 0.25rem;
}
.toggle-ma label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-light);
}
.toggle-ma input {
  accent-color: var(--accent-high);
}

/* Date + company filters */
.date-range {
  min-width: 230px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.date-range label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.date-inputs {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.date-inputs input {
  flex: 1;
  background: rgba(15,23,42,0.9);
  border-radius: 0.4rem;
  border: 1px solid rgba(148,163,184,0.6);
  color: var(--text-light);
  font-size: 0.8rem;
  padding: 0.3rem 0.4rem;
}
.date-inputs span {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.preset-chips {
  margin-top: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.preset-chips button {
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.5);
  background: rgba(15,23,42,0.9);
  color: var(--text-muted);
  font-size: 0.7rem;
  padding: 0.2rem 0.55rem;
  cursor: pointer;
}
.preset-chips button:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.company-filter {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.company-filter label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.company-input-row {
  display: flex;
  gap: 0.4rem;
}
.company-filter input {
  flex: 1;
  border-radius: 0.4rem;
  border: 1px solid rgba(148,163,184,0.6);
  background: rgba(15,23,42,0.9);
  color: var(--text-light);
  font-size: 0.85rem;
  padding: 0.4rem 0.55rem;
}
.focus-btn {
  white-space: nowrap;
  border-radius: 0.4rem;
  border: 1px solid rgba(56,189,248,0.7);
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: white;
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
}
.focus-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
.company-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}
.company-chip {
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.5);
  background: rgba(15,23,42,0.95);
  color: var(--text-muted);
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}
.company-chip.active {
  background: rgba(37,99,235,0.2);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* GRID + CARDS */
.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px,1fr));
  gap: 1.3rem;
  padding-bottom: 0.6rem;
}
.signal-card {
  background: radial-gradient(circle at top left, rgba(37,99,235,0.18), var(--bg-card));
  padding: 1.3rem;
  border-radius: 0.75rem;
  box-shadow: 0 12px 24px rgba(15,23,42,0.8);
  border: 1px solid rgba(148,163,184,0.3);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.signal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 30px rgba(15,23,42,0.9);
  border-color: var(--accent-primary);
}

.signal-card.severity-high {
  border-color: var(--accent-high);
}
.signal-card.severity-medium {
  border-color: var(--accent-medium);
}
.signal-card.severity-low {
  border-color: var(--accent-low);
}

.signal-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}
.signal-header .icon-signal {
  color: var(--accent-primary);
}
.signal-badge {
  padding: 0.18rem 0.55rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.signal-badge.severity-high {
  background-color: #ef444430;
  color: var(--accent-high);
}
.signal-badge.severity-medium {
  background-color: #f59e0b30;
  color: var(--accent-medium);
}
.signal-badge.severity-low {
  background-color: #10b98130;
  color: var(--accent-low);
}

.signal-chip {
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  font-size: 0.65rem;
  border: 1px solid rgba(148,163,184,0.5);
}
.signal-company { color: #facc15; border-color: rgba(250,204,21,0.5); }
.signal-industry { color: #38bdf8; border-color: rgba(56,189,248,0.5); }
.signal-vertical { color: #a855f7; border-color: rgba(168,85,247,0.5); }

.signal-source {
  color: var(--text-muted);
  margin-left: auto;
  font-style: italic;
  font-size: 0.75rem;
}
.signal-title {
  font-size: 1.05rem;
  color: var(--text-light);
  margin-bottom: 0.4rem;
  line-height: 1.4;
  font-weight: 600;
}
.signal-category {
  font-size: 0.82rem;
  color: var(--accent-primary);
  margin-bottom: 0.6rem;
}
.signal-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.1rem;
  flex-grow: 1;
}

/* FOOTER */
.signal-footer {
  border-top: 1px solid rgba(148,163,184,0.35);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.signal-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.signal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: space-between;
}

.view-details-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  font-size: 0.88rem;
}
.view-details-btn:hover {
  color: var(--accent-low);
}

.visioniq-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  background-color: var(--accent-high);
  color: white;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s, transform 0.16s, box-shadow 0.32s;
  text-transform: uppercase;
  font-size: 0.78rem;
}
.visioniq-btn:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(239,68,68,0.4);
}
.pulse-effect {
  box-shadow: 0 0 0 0 rgba(239,68,68,0.7);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}

/* STATUS */
.status-message {
  padding: 1.5rem;
  text-align: center;
  font-size: 1rem;
  border-radius: 0.6rem;
  margin-top: 1.5rem;
  font-weight: 500;
}
.status-message.loading {
  background-color: rgba(15,23,42,0.9);
  color: var(--accent-primary);
}
.status-message.error {
  background-color: #fee2e2;
  color: var(--accent-high);
  border: 1px solid var(--accent-high);
}
.status-message.no-results {
  background-color: rgba(15,23,42,0.9);
  color: var(--text-muted);
}

/* TABLE VIEW */
.signals-table-wrapper {
  border-radius: 0.8rem;
  border: 1px solid rgba(148,163,184,0.35);
  overflow: auto;
  background: rgba(15,23,42,0.95);
}
.signals-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.signals-table thead {
  background: rgba(15,23,42,0.95);
  position: sticky;
  top: 0;
  z-index: 1;
}
.signals-table th,
.signals-table td {
  padding: 0.55rem 0.7rem;
  border-bottom: 1px solid rgba(148,163,184,0.3);
  text-align: left;
}
.signals-table th {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: var(--text-muted);
}
.signals-table tbody tr:hover {
  background: rgba(15,23,42,0.9);
}
.signals-table .col-title a {
  color: var(--accent-primary);
  text-decoration: none;
}
.signals-table .col-title a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .header-main {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .signals-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .signal-actions {
    flex-direction: column;
  }
  .view-details-btn,
  .visioniq-btn {
    justify-content: center;
    width: 100%;
  }
}
`;
