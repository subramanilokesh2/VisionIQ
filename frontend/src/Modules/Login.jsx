import React, { useState, useEffect } from "react";

/**
 * Zinnov Strategy Hub - Enterprise Login Portal v3.0
 * CONNECTED TO BACKEND: http://localhost:5000/login
 */

// --- IMAGERY ---
const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    title: "Strategic Vision",
    desc: "Aligning organizational goals with real-time market intelligence."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
    title: "Boardroom Ready",
    desc: "Synthesize complex data into executive-level narratives."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    title: "Global Impact",
    desc: "Connecting insights across geographies for holistic growth."
  }
];

// --- ICONS ---
const Icons = {
  User: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  ArrowRight: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  Check: () => <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>,
  Error: () => <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
  ZinnovLogo: () => (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
  )
};

// --- COMPONENTS ---

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
      <div className="toast-icon">{type === 'success' ? <Icons.Check /> : <Icons.Error />}</div>
      <div className="toast-content">
        <div className="toast-title">{type === 'success' ? 'Success' : 'Error'}</div>
        <div className="toast-msg">{message}</div>
      </div>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
};

const Carousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="carousel-container">
      {SLIDES.map((slide, index) => (
        <div 
          key={slide.id} 
          className={`slide ${index === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="slide-overlay">
            <div className="slide-content">
              <div className="slide-line"></div>
              <h2>{slide.title}</h2>
              <p>{slide.desc}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="carousel-indicators">
        {SLIDES.map((_, index) => (
          <div 
            key={index} 
            className={`progress-bar ${index === current ? "active" : ""}`}
            onClick={() => setCurrent(index)} 
          >
            <div className="progress-fill"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [empId, setEmpId] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // --- LOGIN LOGIC WITH AUTO-NAME PARSING ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Call your Express Backend
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail_id: email, employee_id: empId }),
      });
//
      const data = await response.json();

      if (response.ok) {
        // --- NAME GENERATION LOGIC ---
        // Since backend only returns { user: { mail_id: "..." } }, we parse the name here
        const mailId = data.user?.mail_id || email; // Fallback to input email if needed
        
        let formattedName = "Zinnov User";
        
        // If email is "subramani.lokesh@zinnov.com", extract "Subramani Lokesh"
        if (mailId.includes("@")) {
            const namePart = mailId.split("@")[0]; // "subramani.lokesh"
            if (namePart.includes(".")) {
                formattedName = namePart.split(".").map(part => 
                    part.charAt(0).toUpperCase() + part.slice(1)
                ).join(" ");
            } else {
                formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            }
        }

        // 2. SAVE TO LOCAL STORAGE
        localStorage.setItem("user_name", formattedName);
        localStorage.setItem("user_role", "Strategy Analyst"); // Default Role for this portal

        setToast({ show: true, message: "Login Successful. Redirecting...", type: "success" });
        
        // 3. REDIRECT TO DASHBOARD
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);

      } else {
        setToast({ show: true, message: data.message || "Invalid Credentials", type: "error" });
        setLoading(false);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setToast({ show: true, message: "Server connection failed. Is backend running?", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* CSS STYLES FOR LOGIN */}
      <style>{`
        :root {
          --primary: #2563eb;
          --primary-dark: #1e3a8a;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --bg-surface: #ffffff;
          --glass-border: rgba(255,255,255,0.1);
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f8fafc; overflow: hidden; }
        .login-wrapper { display: flex; height: 100vh; width: 100vw; position: relative; }
        .form-side { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 100px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); position: relative; z-index: 10; box-shadow: 20px 0 60px rgba(0,0,0,0.05); }
        .blob-container { position: absolute; inset: 0; overflow: hidden; z-index: -1; pointer-events: none; }
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.6; animation: float 10s infinite ease-in-out alternate; }
        .blob-1 { width: 400px; height: 400px; background: #eff6ff; top: -100px; left: -100px; }
        .blob-2 { width: 300px; height: 300px; background: #f0f9ff; bottom: -50px; right: -50px; animation-delay: -5s; }
        @keyframes float { 0% { transform: translate(0,0); } 100% { transform: translate(30px, 40px); } }
        .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 60px; color: var(--primary); }
        .brand h2 { font-size: 1.6rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: var(--text-main); }
        .login-header { margin-bottom: 40px; animation: fadeIn 0.8s ease; }
        .login-header h1 { font-size: 2.8rem; font-weight: 800; color: var(--text-main); margin: 0 0 12px 0; letter-spacing: -1px; }
        .login-header p { color: var(--text-muted); font-size: 1.1rem; margin: 0; font-weight: 400; }
        .input-group { position: relative; margin-bottom: 28px; }
        .input-field { width: 100%; padding: 18px 18px 18px 55px; font-size: 1rem; color: var(--text-main); background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0; border-radius: 16px; outline: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
        .input-field:focus { background: #fff; border-color: var(--primary); box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.15); transform: translateY(-2px); }
        .input-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #94a3b8; transition: color 0.3s; }
        .input-field:focus ~ .input-icon { color: var(--primary); }
        .input-label { position: absolute; left: 55px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1rem; pointer-events: none; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-field:focus ~ .input-label, .input-field:not(:placeholder-shown) ~ .input-label { top: -12px; left: 16px; font-size: 0.8rem; color: var(--primary); background: var(--bg-surface); padding: 0 6px; font-weight: 600; }
        .btn-login { width: 100%; padding: 18px; margin-top: 24px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; border: none; border-radius: 16px; font-size: 1.15rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3); position: relative; overflow: hidden; }
        .btn-login::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: 0.5s; }
        .btn-login:hover { transform: translateY(-3px); box-shadow: 0 20px 30px -10px rgba(37, 99, 235, 0.5); }
        .btn-login:hover::after { left: 100%; }
        .btn-login:disabled { opacity: 0.8; cursor: wait; }
        .meta-links { display: flex; justify-content: space-between; margin-top: 28px; font-size: 0.9rem; color: var(--text-muted); }
        .meta-links label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .meta-links a { color: var(--primary); text-decoration: none; font-weight: 500; }
        .image-side { flex: 1.4; position: relative; overflow: hidden; background: #020617; }
        .carousel-container { width: 100%; height: 100%; position: relative; }
        .slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transform: scale(1.2); transition: opacity 1s ease-in-out, transform 8s ease-out; }
        .slide.active { opacity: 1; transform: scale(1); }
        .slide-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(2, 6, 23, 0.8) 0%, rgba(2, 6, 23, 0.2) 50%, transparent 100%); display: flex; align-items: flex-end; padding: 80px; }
        .slide-content { color: white; max-width: 600px; }
        .slide-line { width: 60px; height: 4px; background: #38bdf8; margin-bottom: 24px; animation: expandWidth 1s ease forwards; }
        .slide-content h2 { font-size: 3.5rem; margin: 0 0 16px 0; font-weight: 800; letter-spacing: -1px; line-height: 1.1; animation: slideUpFade 0.8s ease forwards; }
        .slide-content p { font-size: 1.25rem; opacity: 0; margin: 0; font-weight: 300; color: #cbd5e1; animation: slideUpFade 0.8s ease 0.2s forwards; }
        .carousel-indicators { position: absolute; bottom: 60px; right: 80px; display: flex; gap: 16px; z-index: 20; }
        .progress-bar { width: 60px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; overflow: hidden; }
        .progress-fill { width: 0%; height: 100%; background: #fff; }
        .progress-bar.active .progress-fill { width: 100%; transition: width 6s linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes expandWidth { from { width: 0; } to { width: 60px; } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; }
        .toast { position: fixed; top: 20px; right: 20px; z-index: 100; background: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; align-items: flex-start; gap: 12px; animation: slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); min-width: 300px; }
        .toast.success { border-left: 4px solid #10b981; }
        .toast.error { border-left: 4px solid #ef4444; }
        .toast-title { font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 2px; }
        .toast-msg { color: var(--text-muted); font-size: 0.9rem; }
        .toast-close { background: none; border: none; font-size: 1.5rem; color: #cbd5e1; cursor: pointer; margin-left: auto; line-height: 1; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @media (max-width: 1100px) { .form-side { padding: 40px; } .image-side { display: none; } .login-wrapper { background: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80') center/cover; } .login-wrapper::before { content:''; position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); } .form-side { margin: auto; width: 100%; max-width: 520px; flex: initial; border-radius: 24px; box-shadow: 0 40px 80px rgba(0,0,0,0.3); background: rgba(255,255,255,0.9); } }
      `}</style>

      <div className="form-side">
        <div className="blob-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        <div className="brand">
          <Icons.ZinnovLogo />
          <h2>Zinnov Strategy Hub</h2>
        </div>

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Secure access for Analysts & Consultants.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input 
              className="input-field"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" " 
              required
            />
            <label className="input-label">Office Email</label>
            <div className="input-icon"><Icons.User /></div>
          </div>

          <div className="input-group">
            <input 
              className="input-field"
              type="password" 
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder=" "
              required
            />
            <label className="input-label">Employee ID</label>
            <div className="input-icon"><Icons.Lock /></div>
          </div>

          <div className="meta-links">
            <label>
              <input type="checkbox" style={{accentColor: 'var(--primary)'}} /> Remember device
            </label>
            <a href="#">Forgot credentials?</a>
          </div>

          <button className="btn-login" disabled={loading}>
            {loading ? (
              <>Verifying SSO... <div className="spinner"></div></>
            ) : (
              <>Access Dashboard <Icons.ArrowRight /></>
            )}
          </button>
        </form>

        <div style={{marginTop: '60px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8'}}>
          Authorized Access Only • v3.4.1 (Stable)
        </div>
      </div>

      <div className="image-side">
        <Carousel />
      </div>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

    </div>
  );
};

export default LoginPage;