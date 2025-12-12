// Landing.jsx (Previously LandingPage.jsx)

import React, { useEffect, useRef, useState } from "react";
// Assuming LandingPage.css is available and contains the styles from the first prompt

/**
 * Zinnov Strategy Research Hub — Professional Edition
 * Features: Parallax Hero, Glassmorphism, 3D Mockups, Sticky Nav
 */

// --- Icons ---
const Icons = {
  Rocket: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Chart: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  Users: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Globe: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  ArrowRight: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>,
  Check: () => <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
};

// --- Components ---

const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-item ${isVisible ? "in" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        {/* Updated Logo to VisionIQ */}
        <div className="logo">VisionIQ Strategy Hub</div>
        <div className="nav-actions">
          <a href="#modules">Features</a>
          <a href="#testimonials">Stories</a>
          <button className="btn-small" onClick={() => window.location.href="/login"}>
            Login
          </button>
          <button className="btn-primary-sm" onClick={() => window.location.href="/login"}>
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

const Testimonial = ({ img, name, role, text, delay }) => (
  <Reveal delay={delay}>
    <div className="testimonial-card glass-panel">
      <div className="t-header">
        <img src={img} alt={name} className="t-avatar" />
        <div>
          <h4>{name}</h4>
          <span className="t-role">{role}</span>
        </div>
      </div>
      <p className="t-text">"{text}"</p>
      <div className="t-rating">★★★★★</div>
    </div>
  </Reveal>
);

const Landing = () => {
  return (
    <div className="page-wrapper">
      {/* Keeping the Style block here for self-contained example, but ideally moved to LandingPage.css */}
      <style>{`
        :root {
          --primary: #3b82f6;
          --primary-glow: rgba(59, 130, 246, 0.5);
          --accent: #06b6d4;
          --bg-dark: #0f172a;
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --glass: rgba(15, 23, 42, 0.65);
          --glass-border: rgba(255, 255, 255, 0.08);
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #020617; color: var(--text); overflow-x: hidden; }
        /* Utility */
        .container { width: 90%; max-width: 1200px; margin: 0 auto; position: relative; z-index: 2; }
        .reveal-item { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal-item.in { opacity: 1; transform: translateY(0); }
        /* Navbar */
        .navbar { position: fixed; top: 0; width: 100%; z-index: 100; transition: all 0.3s ease; border-bottom: 1px solid transparent; }
        .navbar.scrolled { background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); border-bottom-color: var(--glass-border); padding: 10px 0; }
        .nav-inner { display: flex; justify-content: space-between; align-items: center; height: 70px; }
        .logo { font-weight: 800; font-size: 1.25rem; letter-spacing: -0.5px; background: linear-gradient(to right, #fff, var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-actions { display: flex; gap: 20px; align-items: center; }
        .nav-actions a { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .nav-actions a:hover { color: #fff; }
        /* Buttons */
        .btn-small { background: transparent; border: 1px solid var(--glass-border); color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .btn-small:hover { background: rgba(255,255,255,0.1); }
        .btn-primary-sm { background: var(--primary); border: none; color: #fff; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary-sm:hover { background: #2563eb; box-shadow: 0 0 15px var(--primary-glow); }
        .btn-hero {
          background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
          color: white; padding: 16px 32px; border-radius: 50px; border: none;
          font-size: 1.1rem; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 10px 30px -10px var(--primary-glow);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -10px var(--primary-glow); }
        /* Hero Section */
        .hero {
          position: relative; min-height: 100vh; display: flex; align-items: center; padding-top: 80px;
          background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop') center/cover no-repeat;
        }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(2,6,23,0.8), #020617); z-index: 1; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-content h1 { font-size: clamp(3rem, 5vw, 4.5rem); line-height: 1.1; margin-bottom: 24px; font-weight: 800; letter-spacing: -1px; }
        .gradient-text { background: linear-gradient(to right, #fff 0%, var(--primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-content p { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 40px; max-width: 500px; line-height: 1.6; }
        /* 3D Dashboard Mockup */
        .mockup-container { perspective: 1500px; position: relative; }
        .mockup-card {
          background: rgba(20, 25, 40, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          overflow: hidden;
          transform: rotateY(-10deg) rotateX(5deg);
          transition: transform 0.5s ease;
          box-shadow: -20px 20px 60px rgba(0,0,0,0.5);
        }
        .mockup-card:hover { transform: rotateY(0) rotateX(0); }
        .mockup-img { width: 100%; height: auto; display: block; opacity: 0.9; }
        /* Stats Floating on Mockup */
        .float-stat {
          position: absolute; background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(8px);
          padding: 12px 20px; border-radius: 12px; border: 1px solid var(--glass-border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          display: flex; gap: 12px; align-items: center;
          animation: float 6s infinite ease-in-out;
        }
        .stat-1 { top: 10%; right: -20px; animation-delay: 0s; }
        .stat-2 { bottom: 15%; left: -20px; animation-delay: -2s; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        /* Feature Grid */
        .features { padding: 120px 0; background: #020617; position: relative; }
        .features::before {
          content:''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: radial-gradient(circle, var(--glass-border) 0%, transparent 100%);
        }
        .section-header { text-align: center; margin-bottom: 80px; }
        .pill { color: var(--accent); font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border: 1px solid rgba(6, 182, 212, 0.2); padding: 6px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }
        .feature-card {
          background: var(--glass); border: 1px solid var(--glass-border); padding: 30px; border-radius: 20px;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .feature-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.15); }
        .feature-card::after {
          content:''; position: absolute; inset: 0; background: radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.06), transparent 40%);
          opacity: 0; transition: opacity 0.3s; pointer-events: none;
        }
        .feature-card:hover::after { opacity: 1; }
        .f-icon { width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 20px; font-size: 1.2rem; }
        /* Testimonials */
        .t-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .t-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); }
        .t-role { color: var(--text-muted); font-size: 0.85rem; }
        .t-text { font-style: italic; color: #cbd5e1; line-height: 1.6; margin-bottom: 15px; }
        .t-rating { color: #fbbf24; font-size: 1.2rem; }
        /* CTA Strip */
        .cta-strip { background: linear-gradient(90deg, var(--bg-dark), #0f172a); padding: 80px 0; text-align: center; position: relative; overflow: hidden; }
        .cta-strip::before { content:''; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
        /* Footer */
        .footer { border-top: 1px solid var(--glass-border); padding: 60px 0; color: var(--text-muted); font-size: 0.9rem; background: #020617; }
        .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .f-col h5 { color: #fff; margin-bottom: 20px; font-size: 1rem; }
        .f-col a { display: block; color: var(--text-muted); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
        .f-col a:hover { color: var(--primary); }
        @media (max-width: 992px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-content { order: 1; }
          .hero-content h1 { font-size: 2.5rem; }
          .hero-content p { margin: 0 auto 30px; }
          .mockup-container { order: 0; margin-bottom: 40px; transform: scale(0.9); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <Navbar />

      {/* --- HERO SECTION --- */}
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-grid">
          
          {/* Left Content */}
          <div className="hero-content">
            <Reveal>
              <div className="pill">Strategy Intelligence Platform</div>
              <h1>Accelerate your <br/><span className="gradient-text">Decision Velocity</span></h1>
              <p>
                The centralized hub for VisionIQ Analysts and Consultants. 
                Access AI-powered market insights, track live OKRs, and execute 
                strategic programs with enterprise-grade security.
              </p>
              <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: window.innerWidth < 992 ? 'center' : 'flex-start'}}>
                <button className="btn-hero" onClick={() => window.location.href="/login"}>
                  Get Started Now <Icons.Rocket />
                </button>
                <button className="btn-small" style={{padding: '16px 32px', borderRadius: '50px', fontSize: '1rem'}}>
                  Watch Demo
                </button>
              </div>
              
              <div style={{marginTop: '40px', display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.8, justifyContent: window.innerWidth < 992 ? 'center' : 'flex-start'}}>
                <div style={{display: 'flex'}}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{width:30, height:30, borderRadius:'50%', background:`rgba(255,255,255,0.${i+2})`, border:'2px solid #0f172a', marginLeft: i>0?-10:0}}></div>
                  ))}
                </div>
                <span style={{fontSize: '0.9rem'}}>Trusted by 500+ Analysts</span>
              </div>
            </Reveal>
          </div>

          {/* Right Visual (3D Mockup) */}
          <div className="mockup-container">
            <Reveal delay={200}>
              <div className="mockup-card">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600" 
                  alt="Dashboard" 
                  className="mockup-img" 
                />
              </div>

              {/* Floating Stats */}
              <div className="float-stat stat-1">
                <div style={{background: '#10b981', borderRadius: '50%', width: 8, height: 8}}></div>
                <div>
                  <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Market Pulse</div>
                  <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>+24% Growth</div>
                </div>
              </div>
              
              <div className="float-stat stat-2">
                <div style={{background: '#3b82f6', padding: 6, borderRadius: 8}}><Icons.Check /></div>
                <div>
                  <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Project Status</div>
                  <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>On Track</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* --- MODULES --- */}
      <section id="modules" className="features">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="pill">Core Capabilities</span>
              <h2>Unified Strategy Engine</h2>
              <p style={{maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)'}}>
                Stop switching between ten different tools. We've consolidated the entire 
                strategy lifecycle into one powerful operating system.
              </p>
            </div>
          </Reveal>

          <div className="grid-3">
            <Reveal delay={100}>
              <div className="feature-card" onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
              }}>
                <div className="f-icon"><Icons.Chart /></div>
                <h3>AI Market Intelligence</h3>
                <p style={{color: 'var(--text-muted)', lineHeight: 1.6}}>
                  Automated competitor tracking and TAM modeling powered by our proprietary 
                  LLM agents. Get insights 10x faster.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="feature-card">
                <div className="f-icon"><Icons.Globe /></div>
                <h3>Project Portfolio</h3>
                <p style={{color: 'var(--text-muted)', lineHeight: 1.6}}>
                  Real-time visibility into every active engagement. Track resource utilization, 
                  margins, and delivery milestones in one view.
                </p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="feature-card">
                <div className="f-icon"><Icons.Users /></div>
                <h3>Knowledge Graph</h3>
                <p style={{color: 'var(--text-muted)', lineHeight: 1.6}}>
                  A semantic search engine that connects dots across thousands of past deliverables, 
                  SOPs, and internal IP assets.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" style={{padding: '100px 0', background: '#0f172a'}}>
        <div className="container">
          <div className="section-header">
            <span className="pill">Success Stories</span>
            <h2>Built for Analysts, by Analysts</h2>
          </div>

          <div className="grid-3">
            <Testimonial 
              delay={0}
              img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              name="Janani B"
              role="Lead Analyst"
              text="The AI Insights module drastically reduced our secondary research time. I can focus on synthesis rather than data gathering."
            />
            <Testimonial 
              delay={200}
              img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
              name="Lokesh S"
              role="Project Lead"
              text="Finally, a platform that understands how strategy projects actually flow. The handoff between teams is seamless now."
            />
            <Testimonial 
              delay={400}
              img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
              name="Hemamalini V"
              role="Consultant"
              text="Having secure access to our entire knowledge base in one click has changed the way we prep for client meetings."
            />
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <div className="cta-strip">
        <div className="container">
          <Reveal>
            <h2 style={{fontSize: '2.5rem', marginBottom: '20px'}}>Ready to elevate your research?</h2>
            <p style={{color: '#cbd5e1', marginBottom: '40px'}}>Join your team on the VisionIQ Strategy Hub today.</p>
            <button className="btn-hero" onClick={() => window.location.href="/login"}>
              Launch Platform Now <Icons.ArrowRight />
            </button>
          </Reveal>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="f-col">
              <h4 className="logo" style={{marginBottom: 20}}>VisionIQ Strategy Hub</h4>
              <p>Internal tools for the modern strategy team.<br/>Built with security and speed in mind.</p>
            </div>
            <div className="f-col">
              <h5>Platform</h5>
              <a href="#">Market Intel</a>
              <a href="#">Project Track</a>
              <a href="#">Knowledge Base</a>
            </div>
            <div className="f-col">
              <h5>Resources</h5>
              <a href="#">Documentation</a>
              <a href="#">API Access</a>
              <a href="#">System Status</a>
            </div>
            <div className="f-col">
              <h5>Support</h5>
              <a href="#">IT Helpdesk</a>
              <a href="#">Request Feature</a>
              <a href="#">Report Bug</a>
            </div>
          </div>
          <div style={{textAlign: 'center', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
            © 2025 VisionIQ. Internal Use Only.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;