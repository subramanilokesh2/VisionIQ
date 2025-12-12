import React, { useState } from "react";

// --- Mocked Icons ---
const Icons = {
  Vision: () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M2 12c5-7 15-7 20 0-5 7-15 7-20 0z" />
    </svg>
  ),
};

// --- VisionIQ Component ---
const VisionIQ = () => {
  const [modelVersion, setModelVersion] = useState("qwen2.5:3b");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    const start = Date.now();

    try {
      const res = await fetch("http://localhost:5000/api/visioniq/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: question,
          filters: {
            // later you can wire UI filters here
            // subPractice: "Automation",
          },
          context: "", // later: pass selected signals / dataset summaries
        }),
      });

      const data = await res.json();
      setLatencyMs(Date.now() - start);

      if (!data.ok) {
        setError(data.error || "VisionIQ error");
        return;
      }

      setAnswer(data.answer || "");
    } catch (err) {
      console.error("VisionIQ frontend error:", err);
      setError("Failed to reach VisionIQ backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="vision-iq-container fade-in-up">
      <h2>VisionIQ Core Configuration</h2>
      <p className="text-muted">
        Configure the local model and ask strategy questions powered by your
        VisionIQ backend.
      </p>

      {/* Config Card */}
      <div className="card config-card" style={{ marginBottom: "16px" }}>
        <h3>Model Settings</h3>
        <div className="setting-group">
          <label>Inference Model (local):</label>
          <select
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
          >
            <option value="qwen2.5:3b">qwen2.5:3b (recommended)</option>
            <option value="llama3.2">llama3.2</option>
          </select>
          <small className="text-muted">
            To switch model backend, change LOCAL_LLM_MODEL in server.js as
            well.
          </small>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => alert("Model config is changed in UI only. To truly switch models, edit LOCAL_LLM_MODEL in server.js.")}
        >
          <Icons.Vision /> Apply Changes
        </button>
      </div>

      {/* Chat / QA Card */}
      <div className="card qa-card">
        <h3>Ask VisionIQ</h3>
        <p className="text-muted">
          Example: “Summarize recent AI-related M&A activity and give 3 strategic implications.”
        </p>

        <textarea
          className="vision-iq-input"
          placeholder="Type your strategy / research question here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />

        <div className="vision-iq-actions">
          <button
            className="primary-btn"
            type="button"
            disabled={loading || !question.trim()}
            onClick={handleAsk}
          >
            {loading ? "Thinking..." : "Ask VisionIQ"}
          </button>
          {latencyMs !== null && (
            <span className="latency-pill">
              {loading ? "Running..." : `Last response: ${latencyMs} ms`}
            </span>
          )}
        </div>

        {error && <div className="error-text">⚠ {error}</div>}

        {answer && (
          <div className="vision-iq-answer">
            <h4>VisionIQ Response</h4>
            <pre>{answer}</pre>
          </div>
        )}
      </div>

      {/* Simple styles for this component */}
      <style>{`
        .vision-iq-container {
          padding: 16px;
        }
        .card {
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 16px;
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }
        .config-card {
          margin-bottom: 16px;
        }
        .setting-group {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .setting-group select,
        .setting-group input[type="number"] {
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
        }
        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #2563eb, #22c55e);
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .qa-card {
          margin-top: 4px;
        }
        .vision-iq-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          padding: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .vision-iq-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25);
        }
        .vision-iq-actions {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .latency-pill {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .vision-iq-answer {
          margin-top: 16px;
          padding: 12px;
          border-radius: 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .vision-iq-answer pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 0.85rem;
        }
        .text-muted {
          font-size: 0.85rem;
          color: #6b7280;
        }
        .error-text {
          margin-top: 8px;
          font-size: 0.8rem;
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default VisionIQ;
