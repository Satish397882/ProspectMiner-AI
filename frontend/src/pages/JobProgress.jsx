import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function JobProgress() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("connecting");
  const [leadsCount, setLeadsCount] = useState(0);
  const [requestedLeads, setRequestedLeads] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pollRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    let eventSource = null;
    let fallbackTimer = setTimeout(() => fetchLeads(), 2000);

    // Start polling for live lead count while scraping
    pollRef.current = setInterval(() => {
      if (status !== "completed" && status !== "error") {
        fetchJobStatus();
      }
    }, 2000);

    try {
      const token = getToken();
      const url = `http://localhost:8000/scrape/${jobId}/stream?token=${token}`;
      eventSource = new EventSource(url);
      eventSource.onopen = () => clearTimeout(fallbackTimer);
      eventSource.onmessage = (e) => {
        clearTimeout(fallbackTimer);
        const data = JSON.parse(e.data);
        setProgress(data.progress || 0);
        setStatus(data.status || "running");
        if (data.leads_count !== undefined) setLeadsCount(data.leads_count);
        if (data.status === "completed") {
          eventSource.close();
          clearInterval(pollRef.current);
          fetchLeads();
        }
      };
      eventSource.onerror = () => {
        clearTimeout(fallbackTimer);
        eventSource.close();
        fetchLeads();
      };
    } catch {
      fetchLeads();
    }

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(pollRef.current);
      if (eventSource) eventSource.close();
    };
  }, [jobId]);

  const fetchJobStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8000/scrape/${jobId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProgress(data.progress || 0);
      setStatus(data.status || "running");
      setLeadsCount(data.leads ? data.leads.length : 0);
      if (data.keyword) setKeyword(data.keyword);
      if (data.location) setLocation(data.location);
      if (data.requested_leads) setRequestedLeads(data.requested_leads);
      if (data.status === "completed") {
        clearInterval(pollRef.current);
        setLeads(data.leads || []);
      }
    } catch {
      // silent fail
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`http://localhost:8000/scrape/${jobId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setLeadsCount(data.leads ? data.leads.length : 0);
      setStatus("completed");
      setProgress(100);
      if (data.keyword) setKeyword(data.keyword);
      if (data.location) setLocation(data.location);
      if (data.requested_leads) setRequestedLeads(data.requested_leads);
    } catch {
      setStatus("error");
    }
  };

  const handleCancel = async () => {
    try {
      const token = getToken();
      await fetch(`http://localhost:8000/scrape/${jobId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      clearInterval(pollRef.current);
      setStatus("cancelled");
    } catch {
      alert("Failed to cancel job");
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Name", "Phone", "Website", "Rating", "Address"];
    const rows = leads.map((lead) => [
      `"${(lead.name || "").replace(/"/g, '""')}"`,
      `"${(lead.phone || "").replace(/"/g, '""')}"`,
      `"${(lead.website || "").replace(/"/g, '""')}"`,
      `"${(lead.rating || "").toString().replace(/"/g, '""')}"`,
      `"${(lead.address || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${jobId.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isRunning =
    status === "running" ||
    status === "scraping" ||
    status === "connecting" ||
    status === "waiting";

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

        {/* Progress Bar */}
        {isRunning && (
          <div className="max-w-2xl mx-auto mb-8 bg-[#1a1f3a]/70 backdrop-blur-md p-6 rounded-2xl border border-white/5">
            {/* Status text */}
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-400">
                {status === "connecting" && "🔄 Connecting..."}
                {status === "waiting" && "⏳ Waiting to start..."}
                {(status === "running" || status === "scraping") &&
                  "🚀 Scraping in progress..."}
              </span>
              <span className="font-bold text-blue-400">{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Live lead count */}
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
          </div>
        )}

        {/* Cancelled state */}
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

        {/* Success banner */}
        {status === "completed" && leads.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-green-400 font-semibold">
                  Scraping Complete!
                </p>
                <p className="text-gray-400 text-sm">
                  {leads.length} leads found successfully
                </p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl transition font-semibold"
            >
              📥 Export CSV
            </button>
          </div>
        )}

        {status === "completed" && leads.length === 0 && (
          <div className="text-gray-400 text-center mt-20 text-xl">
            ⏳ Loading leads...
          </div>
        )}

        {status === "error" && (
          <div className="text-center mt-20">
            <p className="text-red-400 text-xl mb-4">
              ❌ Failed to load job data
            </p>
            <button
              onClick={fetchLeads}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Leads Table */}
        {leads.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex justify-between items-center">
              <p className="text-white font-semibold text-lg">
                📋 {leads.length} Leads Found
              </p>
              <button
                onClick={exportCSV}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm transition border border-white/30"
              >
                📥 Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      #
                    </th>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      Name
                    </th>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      Phone
                    </th>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      Website
                    </th>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      Rating
                    </th>
                    <th className="p-4 text-left text-gray-500 font-medium">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-4 text-gray-400 text-xs">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-800">
                        {lead.name || "-"}
                      </td>
                      <td className="p-4">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-blue-500 hover:underline"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Visit →
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4">
                        {lead.rating ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            ⭐ {lead.rating}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-xs max-w-xs truncate">
                        {lead.address || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {leads.length > 0 && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#1a1f3a]/70 hover:bg-[#252b4a] text-white px-6 py-2 rounded-xl transition border border-white/10"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => navigate("/create-job")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition"
            >
              ➕ New Job
            </button>
            <button
              onClick={exportCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl transition ml-auto"
            >
              📥 Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
