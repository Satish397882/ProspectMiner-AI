import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JobProgress() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    let eventSource = null;
    let fallbackTimer = null;

    fallbackTimer = setTimeout(() => {
      fetchLeads();
    }, 2000);

    try {
      const url = `http://localhost:8000/scrape/${jobId}/stream`;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        clearTimeout(fallbackTimer);
      };

      eventSource.onmessage = (e) => {
        clearTimeout(fallbackTimer);
        const data = JSON.parse(e.data);
        setProgress(data.progress || 0);
        setStatus(data.status || "running");

        if (data.status === "completed") {
          eventSource.close();
          fetchLeads();
        }
      };

      eventSource.onerror = () => {
        clearTimeout(fallbackTimer);
        eventSource.close();
        fetchLeads();
      };
    } catch (error) {
      fetchLeads();
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (eventSource) eventSource.close();
    };
  }, [jobId]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`http://localhost:8000/scrape/${jobId}`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setStatus("completed");
      setProgress(100);
    } catch (error) {
      setStatus("error");
    }
  };

  // ✅ CSV Export Function
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

  return (
    <div className="min-h-screen bg-[#0f1221]">
      {/* Navbar */}
      <nav className="bg-[#1a1f3a] px-8 py-4 flex justify-between items-center shadow-lg">
        <h1
          className="text-2xl font-bold text-white cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          ProspectMiner AI
        </h1>
        <div className="flex gap-6 items-center">
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
      </nav>

      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-6">Job Results</h2>

        {/* Progress Bar */}
        {status !== "completed" && status !== "error" && (
          <div className="max-w-2xl mx-auto mb-8 bg-[#1a1f3a] p-6 rounded-2xl">
            <div className="flex justify-between text-gray-400 text-sm mb-3">
              <span>
                {status === "connecting" && "🔄 Connecting..."}
                {status === "waiting" && "⏳ Waiting to start..."}
                {status === "running" && "🚀 Scraping in progress..."}
                {status === "scraping" && "🚀 Scraping in progress..."}
              </span>
              <span className="font-bold text-blue-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Banner */}
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
            {/* ✅ Export CSV Button */}
            <button
              onClick={exportCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl transition font-semibold flex items-center gap-2 shadow-lg"
            >
              📥 Export CSV
            </button>
          </div>
        )}

        {/* Loading */}
        {status === "completed" && leads.length === 0 && (
          <div className="text-gray-400 text-center mt-20 text-xl">
            ⏳ Loading leads...
          </div>
        )}

        {/* Error */}
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

        {/* Bottom Actions */}
        {leads.length > 0 && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#1a1f3a] hover:bg-[#252b4a] text-white px-6 py-2 rounded-xl transition border border-gray-700"
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
