import React, { useState, useEffect, useMemo, useRef } from "react";
// --- REQUIRED COMPONENT IMPORTS ---
import KnowledgeBase from "./KnowledgeBase.jsx"; 
import LiveSignals from "./LiveSignal.jsx";   
import Databases from "./Database.jsx";       
import VisionIQ from "./Vision.jsx";         
import CompanyProfile from "./CompanyProfile.jsx"; 
// --- END REQUIRED IMPORTS ---

// --- MOCK EXTERNAL MODULES (for single-file execution) ---
const Icons = {
    Vision: ({ style }) => <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>,
    ChevronDown: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    ArrowUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>,
    ArrowDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>,
    ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
    Database: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
    Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><line x1="4" y1="20" x2="20" y2="20"></line></svg>,
    File: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
    Folder: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    Signal: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10l5 5 5-5 5 5 5-5"></path></svg>,
    Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    Logo: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#6366f1" stroke="none"><circle cx="12" cy="12" r="10"/><text x="12" y="15" fontSize="10" textAnchor="middle" fill="#fff" fontFamily="Arial" fontWeight="bold">Z</text></svg>,
    Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
    Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
};

// --- 1. UTILITY & DATA SIMULATION ---
const simulateFileCounts = (practices) => {
    const mockData = {
        'M&A': { Excel: 56, PPT: 20, PDF: 81, total: 157 },
        'Automation': { Excel: 45, PPT: 11, PDF: 30, total: 86 },
        'Zones': { Excel: 57, PPT: 13, PDF: 77, total: 147 },
        'Private Equity': { Excel: 32, PPT: 33, PDF: 21, total: 86 },
        'Services': { Excel: 54, PPT: 14, PDF: 73, total: 141 },
        'Platforms': { Excel: 56, PPT: 17, PDF: 65, total: 138 },
    };

    const data = {};
    let totalFiles = 0;

    practices.forEach(p => {
        data[p] = mockData[p] || {
            total: 0,
            Excel: Math.floor(Math.random() * 50) + 10,
            PPT: Math.floor(Math.random() * 30) + 5,
            PDF: Math.floor(Math.random() * 70) + 20,
        };
        data[p].total = data[p].Excel + data[p].PPT + data[p].PDF;
        totalFiles += data[p].total;
    });

    return { data, totalFiles: 855 };
};

// 🔥 executive metrics will be overridden from backend data
let mockExecutiveMetrics = {
    'Total Signal Hits (24h)': { value: '0', trend: '+0%', type: 'stable' },
    'New Datasets Ingested (7d)': { value: '0', trend: 'Stable', type: 'stable' },
    'Avg. Query Latency (ms)': { value: '145', trend: 'Stable', type: 'stable' },
};

const aiSuggestions = [
    "Identify key growth drivers in the Private Equity Excel data.",
    "Compare Zones automation levels with M&A strategies.",
    "Generate a summary presentation on all ingested PPT files.",
];

// --- Backend data helpers ---

const getNormalizedFileType = (dataset) => {
    const ft = (dataset.metadata?.fileType || "").toLowerCase();
    const name = (dataset.name || "").toLowerCase();

    if (ft.includes("pdf") || name.endsWith(".pdf")) return "PDF";
    if (
        ft.includes("excel") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        name.endsWith(".csv")
    ) return "Excel";
    if (ft.includes("ppt") || name.endsWith(".ppt") || name.endsWith(".pptx")) return "PPT";
    return "Others";
};

const buildFileCountsFromDatasets = (datasets, practicesList) => {
    const counts = {};

    practicesList.forEach(p => {
        counts[p] = { Excel: 0, PPT: 0, PDF: 0, total: 0 };
    });

    datasets.forEach(ds => {
        const practice = ds.metadata?.subPractice || "Others";
        const type = getNormalizedFileType(ds);

        if (!counts[practice]) {
            counts[practice] = { Excel: 0, PPT: 0, PDF: 0, total: 0 };
        }
        if (type === "Excel" || type === "PPT" || type === "PDF") {
            counts[practice][type] += 1;
            counts[practice].total += 1;
        }
    });

    return counts;
};

const computeExecutiveMetricsFromBackend = (datasets, signals) => {
    const now = Date.now();

    const signals24h = (signals || []).filter((s) => {
        if (!s.publishedAt) return false;
        const t = new Date(s.publishedAt).getTime();
        return now - t <= 24 * 60 * 60 * 1000;
    }).length;

    const datasets7d = (datasets || []).filter((d) => {
        if (!d.createdAt) return false;
        const t = new Date(d.createdAt).getTime();
        return now - t <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
        'Total Signal Hits (24h)': { 
            value: signals24h.toString(), 
            trend: signals24h > 0 ? '+12%' : 'Stable', 
            type: signals24h > 0 ? 'positive' : 'stable' 
        },
        'New Datasets Ingested (7d)': { 
            value: datasets7d.toString(), 
            trend: datasets7d > 0 ? '+5%' : 'Stable', 
            type: datasets7d > 0 ? 'positive' : 'stable' 
        },
        'Avg. Query Latency (ms)': { 
            value: '145', 
            trend: 'Stable', 
            type: 'stable' 
        },
    };
};

// --- 2. SHARED COMPONENTS ---

const AgentWelcomeToast = ({ userName, show, onClose }) => {
    if (!show) return null;
    return (
        <div className="agent-toast slide-in-bottom">
            <div className="agent-avatar"><Icons.Vision style={{ width: '24px', height: '24px' }} /></div>
            <div className="agent-content">
                <h4 className="agent-title">VisionIQ Agent Online</h4>
                <p className="agent-message">Welcome back, **{userName}**! I'm your AI strategic partner.</p>
                <button className="agent-btn" onClick={onClose}><Icons.Check /> Got it</button>
            </div>
        </div>
    );
};

const Toast = ({ message, type, show }) => {
    if (!show) return null;
    let icon = '✨';
    if (type === 'success') icon = <Icons.Check />;
    if (type === 'error') icon = '🚫';
    if (type === 'logout') icon = <Icons.Logout />;

    return (
        <div className={`toast ${type} slide-in-right`}>
            <div className="toast-icon">{icon}</div>
            <div className="toast-msg">{message}</div>
        </div>
    );
};

const UserProfile = ({ onLogout, userName, role }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogoutClick = () => {
        setIsOpen(false);
        onLogout();
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const firstName = userName ? userName.split(' ')[0] : 'User';
    const initials = userName ? userName.split(' ').map(n => n[0]).join('') : 'U';

    return (
        <div className="user-profile-container" ref={menuRef}>
            <div className="profile-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="avatar">{initials}</div>
                <div className="profile-text">
                    <span className="user-name-label">{firstName}</span>
                    <span className="user-role-label">{role}</span>
                </div>
                <Icons.ChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="profile-dropdown fade-in-short">
                    <div className="user-info-mini">
                        <span className="name">{userName}</span>
                        <span className="role">{role}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="dropdown-item logout" onClick={handleLogoutClick}>
                        <Icons.Logout /> **Logout Session**
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. OVERVIEW COMPONENT ---

const OverviewContent = ({ fileCounts, totalFiles, userName }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const fileTypes = ['Excel', 'PPT', 'PDF'];
    const aiSuggestionToQuery = (suggestion) => {
        setSearchQuery(suggestion);
    }

    const renderMetricCard = ({ title, value, trend, type }) => {
        let trendIcon = Icons.ArrowRight;
        let trendClass = 'text-muted';

        if (type === 'positive') {
            trendIcon = <Icons.ArrowUp />;
            trendClass = 'text-positive';
        } else if (type === 'negative') {
            trendIcon = <Icons.ArrowDown />;
            trendClass = 'text-negative';
        }

        return (
            <div className="card exec-metric-card">
                <p className="metric-header-sm">{title}</p>
                <div className="exec-value-row">
                    <p className="big-number">{value}</p>
                    <span className={`trend-tag ${trendClass}`}>
                        {trendIcon} {trend}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="overview-container fade-in-up">
            <div className="vision-search-card">
                <div className="search-icon-bg"><Icons.Vision style={{ width: '36px', height: '36px' }} /></div>
                <input
                    type="text"
                    placeholder={`Ask VisionIQ, ${userName}: "Summarize performance data in M&A Excel files from last quarter..."`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vision-search-input"
                />
                <button className="vision-search-btn" disabled={!searchQuery}>
                    <Icons.Sparkles /> Query Data
                </button>
            </div>

            <div className="ai-suggestions-bar">
                <span className="suggestions-label">Quick Queries:</span>
                {aiSuggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="suggestion-tag"
                        onClick={() => aiSuggestionToQuery(suggestion)}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--text-main)' }}>Executive Performance Snapshot</h3>
            <div className="exec-metrics-grid">
                {Object.entries(mockExecutiveMetrics).map(([key, data]) => (
                    <React.Fragment key={key}>
                        {renderMetricCard({ title: key, ...data })}
                    </React.Fragment>
                ))}
            </div>

            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--text-main)' }}>Knowledge Base Summary</h3>

            <div className="card-grid">
                <div className="card high-level-card total-card">
                    <div className="metric-icon"><Icons.Database /></div>
                    <p className="big-number-sm">{totalFiles}</p>
                    <h4 className="metric-header-sm">Total Indexed Files</h4>
                </div>
                {fileTypes.map((type) => {
                    const count = Object.values(fileCounts.data).reduce((sum, p) => sum + (p[type] || 0), 0);
                    const IconComponent = type === 'Excel' ? Icons.Chart : Icons.File;
                    return (
                        <div key={type} className="card high-level-card type-card">
                            <div className="metric-icon"><IconComponent /></div>
                            <p className="big-number-sm">{count}</p>
                            <h4 className="metric-header-sm">{type} Documents</h4>
                        </div>
                    );
                })}
            </div>

            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--text-main)' }}>Practice Area Breakdown</h3>
            <div className="practice-grid">
                {Object.entries(fileCounts.data).map(([practice, counts]) => (
                    <div key={practice} className="practice-card">
                        <div className="practice-header">
                            <Icons.Folder />
                            <h4>{practice}</h4>
                        </div>
                        <div className="count-bar-container">
                            <div className="count-stat total-count">Total Files: {counts.total}</div>
                            {fileTypes.map((type) => (
                                <div key={type} className="count-stat">
                                    <span className="type-label">{type}:</span>
                                    <span className="type-count">{counts[type] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- 4. MAIN DASHBOARD COMPONENT ---

const Dashboard = () => {
    // --- STATE & DATA ---
    const [userInfo, setUserInfo] = useState({
        name: 'Guest User',
        role: 'Viewer'
    });

    useEffect(() => {
        const storedName = localStorage.getItem("user_name");
        const storedRole = localStorage.getItem("user_role");

        if (storedName) {
            setUserInfo({
                name: storedName,
                role: storedRole || 'Strategist'
            });
        }
    }, []);

    const practices = useMemo(() => ['M&A', 'Automation', 'Zones', 'Private Equity', 'Services', 'Platforms'], []);

    const [fileCountsData, setFileCountsData] = useState(() => simulateFileCounts(practices).data);
    const [totalFiles, setTotalFiles] = useState(0);
    const [datasets, setDatasets] = useState([]);
    const [signals, setSignals] = useState([]);

    const [viewState, setViewState] = useState("login");
    const [activeTab, setActiveTab] = useState("Overview");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showAgentWelcome, setShowAgentWelcome] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    // KB State
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [currentMetadata, setCurrentMetadata] = useState(null);

    // 🔥 Fetch datasets & signals from backend once
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dsRes, sigRes] = await Promise.all([
                    fetch("http://localhost:5000/api/datasets"),
                    fetch("http://localhost:5000/api/signals")
                ]);

                const dsJson = await dsRes.json();
                const sigJson = await sigRes.json();

                if (dsJson.success) {
                    setDatasets(dsJson.datasets || []);
                    setTotalFiles((dsJson.datasets || []).length);
                    const counts = buildFileCountsFromDatasets(dsJson.datasets || [], practices);
                    setFileCountsData(counts);
                }

                if (sigJson.success) {
                    setSignals(sigJson.signals || []);
                }

                mockExecutiveMetrics = computeExecutiveMetricsFromBackend(
                    dsJson.success ? dsJson.datasets || [] : [],
                    sigJson.success ? sigJson.signals || [] : []
                );
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            }
        };

        fetchData();
    }, [practices]);

    // Navigation Items (added Company Profiler)
    const navigationItems = useMemo(() => [
        { id: "Overview", icon: <Icons.Home />, component: OverviewContent, title: "Dashboard Overview" },
        { id: "Company Profiler", icon: <Icons.Chart />, component: CompanyProfile, title: "Company Profile Generator" },
        { id: "Knowledge Base", icon: <Icons.Database />, component: KnowledgeBase, title: "Knowledge Base Ingestion" },
        { id: "Live Signals", icon: <Icons.Signal />, component: LiveSignals, title: "Real-Time Signal Monitoring" },
        { id: "Databases", icon: <Icons.Folder />, component: Databases, title: "Data Source Management" },
        { id: "Vision IQ", icon: <Icons.Vision />, component: VisionIQ, title: "VisionIQ Core Configuration" },
    ], []);

    useEffect(() => {
        if (viewState === "login") {
            setTimeout(() => {
                setViewState("dashboard");
                setTimeout(() => setShowAgentWelcome(true), 1000);
            }, 500);
        }
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [viewState, isDarkMode]);

    const handleLogout = () => {
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");

        setToast({ show: true, msg: `Goodbye, ${userInfo.name.split(' ')[0]}! Session ended.`, type: "logout" });
        setTimeout(() => {
            setToast({ show: false });
            window.location.href = "/";
        }, 2000);
    };

    const handleUpload = (file, metadata) => {
        setCurrentFile(file);
        setCurrentMetadata(metadata);
        const ext = file.name.split('.').pop().toLowerCase();

        if (!metadata.tableName) {
            setToast({ show: true, msg: "Table Name is required!", type: "error" });
            setTimeout(() => setToast({ show: false }), 3000);
            return;
        }

        if (ext === 'xlsx' || ext === 'xls') {
            setViewState("sanitize");
        } else {
            setToast({ show: true, msg: `${file.name} ingested directly.`, type: "success" });
            setUploadedFiles(prev => [...prev, file]);
            setTimeout(() => setToast({ show: false }), 3000);
        }
    };

    const handleFinalIngest = (sanitizedHeaders) => {
        setViewState("dashboard");
        setToast({ show: true, msg: `Dataset "${currentMetadata.tableName}" ingested.`, type: "success" });
        setUploadedFiles(prev => [...prev, currentFile]);
        setCurrentFile(null);
        setCurrentMetadata(null);
        setTimeout(() => setToast({ show: false }), 4000);
    };

    const renderActiveTab = () => {
        const activeItem = navigationItems.find(item => item.id === activeTab);
        if (!activeItem) return null;

        const Component = activeItem.component;

        if (activeItem.id === "Overview") {
            return <OverviewContent fileCounts={{ data: fileCountsData }} totalFiles={totalFiles} userName={userInfo.name} />;
        }
        
        if (activeItem.id === "Knowledge Base") {
            return (
                <KnowledgeBase 
                    onFileIngest={handleUpload} 
                    uploadedFiles={uploadedFiles} 
                    practices={practices}
                    currentFile={currentFile} 
                    currentMetadata={currentMetadata}
                    viewState={viewState}
                    handleFinalIngest={handleFinalIngest}
                    setViewState={setViewState}
                />
            );
        }

        // Company Profiler and other tabs just render their component
        return <Component />;
    };

    if (viewState === "landing" || viewState === "login") return null;

    return (
        <div className="app-container" data-theme={isDarkMode ? 'dark' : 'light'}>
            <style>{`
        :root { --bg-dark: #070919; --bg-light: #f1f5f9; --sidebar-dark: rgba(15, 17, 26, 0.95); --sidebar-light: #ffffff; --text-main: #f1f5f9; --text-muted: #94a3b8; --primary: #6366f1; --accent: #a855f7; --glass: rgba(255, 255, 255, 0.05); --border: rgba(255,255,255,0.08); --positive: #10b981; --negative: #ef4444; --stable: #f59e0b; --shadow-lg: 0 10px 30px rgba(0,0,0,0.5); --card-bg-dark: rgba(15, 17, 26, 0.8); }
        [data-theme="light"] { --bg-dark: #f1f5f9; --text-main: #1e293b; --sidebar-dark: #ffffff; --border: #e2e8f0; --glass: rgba(0,0,0,0.03); --shadow-lg: 0 10px 30px rgba(0,0,0,0.1); --card-bg-dark: #ffffff; }
        * { box-sizing: border-box; outline: none; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; overflow: hidden; background: var(--bg-dark); color: var(--text-main); transition: background 0.3s; }
        .app-container { display: flex; height: 100vh; width: 100vw; background-color: var(--bg-dark); background-image: radial-gradient(at 0% 0%, rgba(99,102,241,0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(168,85,247,0.1) 0, transparent 50%); }
        .sidebar { width: ${isSidebarCollapsed ? '70px' : '260px'}; background: var(--sidebar-dark); backdrop-filter: blur(10px); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 12px; transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 50; box-shadow: var(--shadow-lg); }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; padding-left: 4px; font-weight: 800; font-size: 1.2rem; white-space: nowrap; overflow: hidden; color: var(--text-main); }
        .nav-item { display: flex; align-items: center; gap: 14px; padding: 12px; margin-bottom: 4px; color: var(--text-muted); border-radius: 10px; cursor: pointer; transition: 0.2s; }
        .nav-item:hover { background: var(--glass); color: var(--primary); transform: translateX(3px); }
        .nav-item.active { background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05)); color: var(--primary); border-left: 3px solid var(--primary); font-weight: 600; }
        .nav-text { opacity: ${isSidebarCollapsed ? 0 : 1}; transition: opacity 0.2s; white-space: nowrap; }
        .main { flex: 1; padding: 30px 50px; overflow-y: auto; display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
        .page-title { font-size: 2rem; font-weight: 700; margin: 0; background: linear-gradient(90deg, var(--text-main) 60%, var(--text-muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .footer { margin-top: auto; padding-top: 40px; text-align: center; color: var(--text-muted); font-size: 0.8rem; padding-bottom: 20px; }
        .user-profile-container { position: relative; margin-right: 10px; }
        .profile-trigger { display: flex; align-items: center; cursor: pointer; padding: 8px 12px; border-radius: 9999px; background: var(--glass); border: 1px solid var(--border); transition: 0.3s; }
        .profile-trigger:hover { background: rgba(99,102,241,0.1); }
        .avatar { width: 32px; height: 32px; background: linear-gradient(45deg, var(--primary), var(--accent)); color: white; border-radius: 50%; display: grid; place-items: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; border: 2px solid var(--text-main); }
        .profile-text { display: flex; flex-direction: column; margin-left: 10px; line-height: 1.2; }
        .user-name-label { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
        .user-role-label { font-size: 0.7rem; color: var(--text-muted); }
        .chevron { transition: transform 0.3s; margin-left: 8px; }
        .chevron.open { transform: rotate(180deg); }
        .profile-dropdown { position: absolute; top: 50px; right: 0; min-width: 240px; background: var(--sidebar-dark); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-lg); padding: 10px; z-index: 100; }
        .user-info-mini { padding: 5px 10px; border-bottom: 1px solid var(--border); margin-bottom: 10px; }
        .user-info-mini .name { display: block; font-weight: 700; font-size: 1rem; color: var(--text-main); }
        .user-info-mini .role { display: block; font-size: 0.8rem; color: var(--text-muted); }
        .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; color: var(--negative); }
        .dropdown-item.logout:hover { background: rgba(239, 68, 68, 0.1); }
        .toast { position: fixed; top: 20px; right: 20px; background: var(--sidebar-dark); border: 1px solid var(--primary); border-radius: 12px; box-shadow: var(--shadow-lg); padding: 15px; display: flex; gap: 15px; align-items: center; z-index: 400; min-width: 300px; animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .toast.success { border-color: var(--positive); }
        .toast.error { border-color: var(--negative); }
        .toast.logout { border-color: var(--negative); color: var(--negative); }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .agent-toast { position: fixed; bottom: 30px; right: 30px; background: var(--sidebar-dark); border: 1px solid var(--primary); border-radius: 12px; box-shadow: var(--shadow-lg); padding: 15px; display: flex; gap: 15px; align-items: flex-start; z-index: 300; min-width: 300px; animation: slideInBottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .agent-content h4, .agent-content p { margin: 0; }
        .agent-content h4 { font-size: 1rem; color: var(--primary); }
        .agent-content p { font-size: 0.9rem; margin-top: 5px; color: var(--text-muted); }
        .agent-btn { background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; margin-top: 10px; display: flex; align-items: center; gap: 5px; font-weight: 600; }
        .agent-avatar { flex-shrink: 0; color: var(--primary); }
        @keyframes slideInBottom { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        .vision-search-card { display: flex; align-items: center; background: #000000; padding: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 5px 15px rgba(0,0,0,0.4); position: relative; max-width: 100%; }
        .search-icon-bg { padding: 10px; border-radius: 10px; color: var(--primary); flex-shrink: 0; display: grid; place-items: center; }
        .vision-search-input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 1.1rem; padding: 0 15px; height: 40px; outline: none; }
        .vision-search-input::placeholder { color: var(--text-muted); }
        .vision-search-btn { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: background 0.2s; flex-shrink: 0; }
        .vision-search-btn:hover:not(:disabled) { background: #9440e0; }
        .vision-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ai-suggestions-bar { display: flex; align-items: center; gap: 10px; margin-top: 15px; padding-left: 20px; }
        .suggestions-label { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
        .suggestion-tag { background: var(--glass); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .suggestion-tag:hover { background: rgba(99,102,241,0.1); color: var(--primary); }
        .card { background: var(--card-bg-dark); backdrop-filter: blur(5px); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .high-level-card { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .metric-icon { color: var(--primary); margin-bottom: 10px; background: rgba(99,102,241,0.1); padding: 8px; border-radius: 8px; }
        .big-number-sm { font-size: 2rem; font-weight: 700; margin: 0; }
        .metric-header-sm { font-size: 0.9rem; color: var(--text-muted); margin-top: 5px; }
        .practice-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .practice-card { background: var(--card-bg-dark); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
        .practice-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: var(--primary); }
        .practice-header h4 { margin: 0; font-weight: 600; color: var(--text-main); }
        .count-stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border); font-size: 0.9rem; }
        .count-stat:last-child { border-bottom: none; }
        .total-count { font-weight: 700; color: var(--primary); }
        .exec-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .exec-metric-card { padding: 15px 20px; border: 1px solid var(--primary); box-shadow: 0 0 10px rgba(99,102,241,0.2); }
        .exec-value-row { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 10px; }
        .exec-metric-card .big-number { font-size: 2.5rem; font-weight: 800; line-height: 1; margin: 0; }
        .trend-tag { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; background: var(--glass); }
        .text-positive { color: var(--positive); }
        .text-negative { color: var(--negative); }
        .text-muted { color: var(--text-muted); }
        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        .fade-in-short { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 1024px) { .card-grid { grid-template-columns: repeat(2, 1fr); } .practice-grid { grid-template-columns: 1fr; } .main { padding: 20px; } }
            `}</style>

            <div className="sidebar">
                <div className="logo">
                    <Icons.Logo />
                    {!isSidebarCollapsed && <span>VisionIQ Hub</span>}
                </div>

                <nav className="main-nav">
                    {navigationItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                            title={item.title}
                        >
                            {item.icon}
                            <span className="nav-text">{item.id}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-bottom" style={{ marginTop: 'auto' }}>
                    <div
                        className="nav-item"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                        <span className="nav-text">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>

                    <div
                        className="nav-item"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        <Icons.Menu />
                        <span className="nav-text">{isSidebarCollapsed ? 'Expand' : 'Collapse'}</span>
                    </div>
                </div>
            </div>

            <div className="main">
                <header className="header">
                    <h1 className="page-title">
                        {navigationItems.find(item => item.id === activeTab)?.title}
                    </h1>
                    <UserProfile
                        onLogout={handleLogout}
                        userName={userInfo.name}
                        role={userInfo.role}
                    />
                </header>

                <main className="content-area">
                    {renderActiveTab()}
                </main>

                <footer className="footer">
                    &copy; {new Date().getFullYear()} VisionIQ Platform. AI Strategic Partner.
                </footer>
            </div>

            <Toast {...toast} />
            <AgentWelcomeToast
                userName={userInfo.name.split(' ')[0]}
                show={showAgentWelcome}
                onClose={() => setShowAgentWelcome(false)}
            />
        </div>
    );
};

export default Dashboard;
