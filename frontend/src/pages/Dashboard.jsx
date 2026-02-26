import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_leads: 0,
    active_jobs: 0,
    completed_jobs: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/scrape/stats");
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f1221]">
      <nav className="bg-[#1a1f3a] px-4 md:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold text-white">
          ProspectMiner AI
        </h1>
        <div className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white font-semibold border-b-2 border-blue-500 pb-1"
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
          <button
            onClick={() => navigate("/analytics")}
            className="text-gray-300 hover:text-white transition"
          >
            Analytics
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
            className="text-white font-semibold text-left py-2 border-b border-gray-700"
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
          <button
            onClick={() => {
              navigate("/analytics");
              setMenuOpen(false);
            }}
            className="text-gray-300 text-left py-2 border-b border-gray-700"
          >
            Analytics
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 rounded-lg mt-2"
          >
            Logout
          </button>
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
            Welcome to ProspectMiner AI 🚀
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-8">
            Your intelligent lead generation platform
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div
              className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 md:p-8 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
              onClick={() => navigate("/create-job")}
            >
              <div className="text-4xl md:text-5xl mb-3">🎯</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Create New Job
              </h3>
              <p className="text-blue-100 text-sm md:text-base">
                Start scraping leads from Google Maps
              </p>
            </div>

            <div
              className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 md:p-8 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
              onClick={() => navigate("/history")}
            >
              <div className="text-4xl md:text-5xl mb-3">📊</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Job History
              </h3>
              <p className="text-purple-100 text-sm md:text-base">
                View all your previous scraping jobs
              </p>
            </div>

            <div
              className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 md:p-8 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition sm:col-span-2 md:col-span-1"
              onClick={() => navigate("/analytics")}
            >
              <div className="text-4xl md:text-5xl mb-3">📈</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Total Leads
              </h3>
              {loading ? (
                <div className="animate-pulse h-10 bg-green-400 rounded w-20" />
              ) : (
                <>
                  <p className="text-green-100 text-3xl md:text-4xl font-bold">
                    {stats.total_leads}
                  </p>
                  <p className="text-green-100 text-sm mt-1">Scraped so far</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#1a1f3a] rounded-2xl p-4 md:p-8 shadow-xl">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Quick Stats
              </h3>
              <button
                onClick={fetchStats}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg transition"
              >
                🔄 Refresh
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 bg-gray-700 rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div className="text-center bg-[#0f1221] p-3 md:p-6 rounded-xl">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">
                    Active Jobs
                  </p>
                  <p className="text-white text-2xl md:text-4xl font-bold">
                    {stats.active_jobs}
                  </p>
                </div>
                <div className="text-center bg-[#0f1221] p-3 md:p-6 rounded-xl">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">
                    Completed
                  </p>
                  <p className="text-white text-2xl md:text-4xl font-bold">
                    {stats.completed_jobs}
                  </p>
                </div>
                <div className="text-center bg-[#0f1221] p-3 md:p-6 rounded-xl">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">
                    Success Rate
                  </p>
                  <p className="text-white text-2xl md:text-4xl font-bold">
                    {stats.success_rate}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
