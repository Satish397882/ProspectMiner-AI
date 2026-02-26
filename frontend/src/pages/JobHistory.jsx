import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function JobHistory() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/scrape/history");
      const data = await res.json();
      setJobs(data.jobs || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    setDeletingId(jobId);
    try {
      await fetch(`http://localhost:8000/scrape/${jobId}`, {
        method: "DELETE",
      });
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch {
      alert("Failed to delete job");
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    if (status === "completed")
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (status === "running" || status === "scraping")
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    if (status === "error")
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  };

  const getStatusText = (status) => {
    if (status === "completed") return "✅ Completed";
    if (status === "running" || status === "scraping") return "⏳ Running";
    if (status === "error") return "❌ Failed";
    return status;
  };

  // Filter + Search
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      (job.keyword || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.location || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || job.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#0f1221]">
      {/* Navbar */}
      <nav className="bg-[#1a1f3a] px-4 md:px-8 py-4 flex justify-between items-center shadow-lg">
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
            className="text-white font-semibold border-b-2 border-blue-500 pb-1"
          >
            History
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
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
        <div className="md:hidden bg-[#1a1f3a] px-4 py-4 flex flex-col gap-3 border-t border-gray-700">
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
            className="text-white font-semibold text-left py-2 border-b border-gray-700"
          >
            History
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 rounded-lg mt-2"
          >
            Logout
          </button>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Job History 📊
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              All your previous scraping jobs
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={fetchHistory}
              className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => navigate("/create-job")}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              ➕ New Job
            </button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        {!loading && jobs.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="🔍 Search by keyword or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-[#1a1f3a] text-white placeholder-gray-500 px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#1a1f3a] text-gray-300 px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">✅ Completed</option>
              <option value="running">⏳ Running</option>
              <option value="error">❌ Failed</option>
            </select>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl animate-pulse">Loading...</p>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 bg-[#1a1f3a] rounded-2xl">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-white mb-2">No jobs yet</h3>
            <p className="text-gray-400 mb-6">Create your first scraping job</p>
            <button
              onClick={() => navigate("/create-job")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl transition"
            >
              🚀 Create First Job
            </button>
          </div>
        )}

        {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="text-center py-16 bg-[#1a1f3a] rounded-2xl">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white text-xl font-bold mb-2">
              No results found
            </p>
            <p className="text-gray-400">Try a different search or filter</p>
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("all");
              }}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && filteredJobs.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-3">
              {filteredJobs.length} of {jobs.length} jobs
              {search && (
                <span>
                  {" "}
                  matching "<span className="text-white">{search}</span>"
                </span>
              )}
            </p>

            {/* Desktop Table */}
            <div className="hidden md:block bg-[#1a1f3a] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0f1221]">
                    <th className="p-4 text-left text-gray-400 font-medium">
                      #
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Keyword
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Location
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Leads
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Progress
                    </th>
                    <th className="p-4 text-left text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, index) => (
                    <tr
                      key={job.job_id}
                      className="border-t border-gray-700/50 hover:bg-[#0f1221]/50 transition"
                    >
                      <td className="p-4 text-gray-500 text-sm">{index + 1}</td>
                      <td className="p-4 text-white font-medium">
                        {job.keyword || "Unknown"}
                      </td>
                      <td className="p-4 text-gray-300">
                        {job.location || "Unknown"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}
                        >
                          {getStatusText(job.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-bold">
                          {job.leads_count}
                        </span>
                        {job.requested_leads > 0 && (
                          <span className="text-gray-500 text-sm ml-1">
                            / {job.requested_leads}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs">
                            {job.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/job/${job.job_id}`)}
                            className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1 rounded-lg text-sm transition border border-blue-500/30"
                          >
                            View →
                          </button>
                          {confirmDelete === job.job_id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(job.job_id)}
                                disabled={deletingId === job.job_id}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs transition"
                              >
                                {deletingId === job.job_id ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded-lg text-xs transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(job.job_id)}
                              className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded-lg text-sm transition border border-red-500/30"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.job_id}
                  className="bg-[#1a1f3a] rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold text-lg">
                        {job.keyword || "Unknown"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        📍 {job.location || "Unknown"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}
                    >
                      {getStatusText(job.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-gray-400 text-xs">Leads Found</p>
                      <p className="text-white font-bold text-xl">
                        {job.leads_count}{" "}
                        <span className="text-gray-500 text-sm font-normal">
                          / {job.requested_leads}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs">
                          {job.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/job/${job.job_id}`)}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 py-2 rounded-xl text-sm transition border border-blue-500/30"
                    >
                      View Leads →
                    </button>
                    {confirmDelete === job.job_id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(job.job_id)}
                          className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm"
                        >
                          {deletingId === job.job_id ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="bg-gray-600 text-white px-3 py-2 rounded-xl text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(job.job_id)}
                        className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-500/30"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
