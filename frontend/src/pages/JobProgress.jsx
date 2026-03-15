import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function JobProgress() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("pending");
  const [leadsCount, setLeadsCount] = useState(0);
  const [requestedLeads, setRequestedLeads] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [credits, setCredits] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const pollRef = useRef(null);
  const eventSourceRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  const fetchCredits = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/credits", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setCredits(data.credits);
    } catch {}
  };

  const fetchJobStatus = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const job = data.job;

      setProgress(job.progress || 0);
      setStatus(job.status || "pending");
      setLeadsCount(job.leadsScraped || 0);
      setRequestedLeads(job.numberOfLeads || 0);
      if (job.keyword) setKeyword(job.keyword);
      if (job.location) setLocation(job.location);

      if (job.status === "completed") {
        clearInterval(pollRef.current);
        setCreditsUsed(job.leadsScraped || 0);
        fetchCredits();
        setTimeout(() => navigate(`/leads/${jobId}`), 2500);
      }
      if (job.status === "failed") {
        clearInterval(pollRef.current);
      }
    } catch {}
  };

  useEffect(() => {
    fetchJobStatus();
    fetchCredits();

    const token = getToken();
    const es = new EventSource(
      `http://localhost:5000/api/jobs/${jobId}/sse?token=${token}`,
    );
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.status) setStatus(data.status);
        if (data.leadsScraped !== undefined) setLeadsCount(data.leadsScraped);
        if (data.numberOfLeads) setRequestedLeads(data.numberOfLeads);

        if (data.status === "completed") {
          es.close();
          clearInterval(pollRef.current);
          setCreditsUsed(data.leadsScraped || 0);
          fetchCredits();
          setTimeout(() => navigate(`/leads/${jobId}`), 2500);
        }
        if (data.status === "failed") {
          es.close();
          clearInterval(pollRef.current);
        }
      } catch (e) {
        console.log("SSE parse error:", e);
      }
    };

    es.onerror = () => {
      es.close();
      pollRef.current = setInterval(fetchJobStatus, 3000);
    };

    return () => {
      es.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  const handleCancel = async () => {
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (eventSourceRef.current) eventSourceRef.current.close();
      clearInterval(pollRef.current);
      setStatus("cancelled");
    } catch {
      alert("Failed to cancel job");
    }
  };

  const isRunning =
    status === "running" ||
    status === "scraping" ||
    status === "pending" ||
    status === "connecting";

  return (
    <div className="min-h-screen bg-[#0a0d1a] relative overflow-hidden">
      <AnimatedBackground />

      <nav className="relative z-10 bg-[#1a1f3a]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center shadow-lg border-b border-white/5">
        <h1
          className="text-xl md:text-2xl font-bold text-white cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          ProspectMiner AI
        </h1>
        <div className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-300 hover:text-white transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/create-job")}
            className="text-gray-300 hover:text-white transition"
          >
            Create Job
          </button>
          <button
            onClick={() => navigate("/history")}
            className="text-gray-300 hover:text-white transition"
          >
            History
          </button>
          {credits !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
                credits < 50
                  ? "bg-red-500/20 border-red-500/30 text-red-400"
                  : credits < 150
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                    : "bg-green-500/20 border-green-500/30 text-green-400"
              }`}
            >
              💳 {credits} credits
            </div>
          )}
        </div>
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="relative z-10 md:hidden bg-[#1a1f3a]/90 backdrop-blur-md px-4 py-4 flex flex-col gap-3 border-t border-gray-700">
          <button
            onClick={() => {
              navigate("/dashboard");
              setMenuOpen(false);
            }}
            className="text-gray-300 text-left py-2 border-b border-gray-700"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              navigate("/create-job");
              setMenuOpen(false);
            }}
            className="text-gray-300 text-left py-2 border-b border-gray-700"
          >
            Create Job
          </button>
          <button
            onClick={() => {
              navigate("/history");
              setMenuOpen(false);
            }}
            className="text-gray-300 text-left py-2 border-b border-gray-700"
          >
            History
          </button>
          {credits !== null && (
            <div className="text-green-400 text-sm py-2 border-b border-gray-700">
              💳 {credits} credits
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Job Results
            </h2>
            {(keyword || location) && (
              <p className="text-gray-400 text-sm mt-1">
                🔍 {keyword} {location && `in ${location}`}
              </p>
            )}
          </div>
          {isRunning && (
            <button
              onClick={handleCancel}
              className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 px-4 py-2 rounded-xl text-sm transition border border-yellow-500/30"
            >
              ⛔ Cancel Job
            </button>
          )}
        </div>

        {isRunning && (
          <div className="max-w-2xl mx-auto mb-8 bg-[#1a1f3a]/70 backdrop-blur-md p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-400">
                {status === "pending" && "⏳ Waiting to start..."}
                {(status === "running" || status === "scraping") &&
                  "🚀 Scraping in progress..."}
                {status === "connecting" && "🔄 Connecting..."}
              </span>
              <span className="font-bold text-blue-400">{progress}%</span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-blue-400 text-sm font-medium">
                  {leadsCount} leads found
                  {requestedLeads > 0 && (
                    <span className="text-gray-500">
                      {" "}
                      / {requestedLeads} requested
                    </span>
                  )}
                </span>
              </div>
              <span className="text-gray-500 text-xs animate-pulse">
                Live updating...
              </span>
            </div>

            {/* Credits usage during scraping */}
            {credits !== null && (
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                <span>
                  💳 Credits remaining:{" "}
                  <span className="text-white font-medium">{credits}</span>
                </span>
                <span>
                  Will use:{" "}
                  <span className="text-yellow-400 font-medium">
                    {leadsCount} credits so far
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {status === "completed" && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-green-400 font-semibold text-lg mb-1">
              Scraping Complete!
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {leadsCount} leads found — redirecting to leads page...
            </p>
            {/* Credits summary */}
            <div className="bg-[#0f1221]/80 rounded-xl p-3 flex justify-between items-center text-sm">
              <span className="text-gray-400">💳 Credits used:</span>
              <span className="text-red-400 font-bold">
                -{creditsUsed || leadsCount}
              </span>
            </div>
            {credits !== null && (
              <div className="bg-[#0f1221]/80 rounded-xl p-3 flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">💳 Remaining balance:</span>
                <span
                  className={`font-bold ${credits < 50 ? "text-red-400" : credits < 150 ? "text-yellow-400" : "text-green-400"}`}
                >
                  {credits} credits
                </span>
              </div>
            )}
          </div>
        )}

        {status === "cancelled" && (
          <div className="max-w-2xl mx-auto mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">⛔</div>
            <p className="text-yellow-400 font-semibold text-lg mb-1">
              Job Cancelled
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {leadsCount > 0
                ? `${leadsCount} leads were collected before cancellation`
                : "No leads collected"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/create-job")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition"
              >
                ➕ New Job
              </button>
              <button
                onClick={() => navigate("/history")}
                className="bg-[#1a1f3a] hover:bg-[#252b4a] text-white px-6 py-2 rounded-xl transition border border-white/10"
              >
                📊 History
              </button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-red-400 font-semibold text-lg mb-1">
              Job Failed
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Scraping encountered an error. Please try again.
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => navigate("/create-job")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition"
              >
                ➕ New Job
              </button>
              <button
                onClick={() => navigate("/history")}
                className="bg-[#1a1f3a] text-white px-6 py-2 rounded-xl transition border border-white/10"
              >
                📊 History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
