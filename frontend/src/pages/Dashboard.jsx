import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import AnimatedBackground from "../components/AnimatedBackground";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_leads: 0,
    active_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    total_jobs: 0,
    success_rate: 0,
    credits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(() => fetchStats(true), 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchStats = async (silent = false) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/jobs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      if (!silent) setLoading(false);
    } catch {
      if (!silent) setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0d1a] relative overflow-hidden">
      <AnimatedBackground />

      <nav className="relative z-10 bg-[#1a1f3a]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center shadow-lg border-b border-white/5">
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
          {/* Credits badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
              stats.credits < 50
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : stats.credits < 150
                  ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                  : "bg-green-500/20 border-green-500/30 text-green-400"
            }`}
          >
            💳 {loading ? "..." : stats.credits} credits
          </div>
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
        <div className="relative z-10 md:hidden bg-[#1a1f3a]/90 backdrop-blur-md px-4 py-4 flex flex-col gap-3 border-t border-gray-700">
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
          <div className="text-green-400 text-sm py-2 border-b border-gray-700">
            💳 {stats.credits} credits
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 rounded-lg mt-2"
          >
            Logout
          </button>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Welcome to ProspectMiner AI 🚀
            </h2>
            <p className="text-gray-400 text-base md:text-lg">
              Your intelligent lead generation platform
            </p>
          </div>

          {/* Low credits warning */}
          {!loading && stats.credits < 50 && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-red-400 font-semibold text-sm">
                    Low Credits!
                  </p>
                  <p className="text-gray-400 text-xs">
                    You have only {stats.credits} credits remaining. 1 credit =
                    1 lead.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              onClick={() => navigate("/create-job")}
              className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
            >
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-white mb-1">New Job</h3>
              <p className="text-blue-100 text-xs">
                Scrape leads from Google Maps
              </p>
            </div>

            <div
              onClick={() => navigate("/history")}
              className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-white mb-1">Job History</h3>
              <p className="text-purple-100 text-xs">View all scraping jobs</p>
            </div>

            <div
              onClick={() => navigate("/analytics")}
              className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
            >
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-lg font-bold text-white mb-1">Analytics</h3>
              <p className="text-green-100 text-xs">
                Track performance & insights
              </p>
            </div>

            <div
              onClick={() => navigate("/history")}
              className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-6 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-bold text-white mb-1">Total Leads</h3>
              {loading ? (
                <div className="animate-pulse h-8 bg-orange-400/50 rounded w-16 mt-1" />
              ) : (
                <p className="text-white text-3xl font-bold">
                  {stats.total_leads}
                </p>
              )}
            </div>
          </div>

          {/* Credits Card */}
          <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl border border-white/5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Available Credits</p>
                  {loading ? (
                    <div className="animate-pulse h-8 bg-gray-700 rounded w-20 mt-1" />
                  ) : (
                    <p
                      className={`text-3xl font-bold ${
                        stats.credits < 50
                          ? "text-red-400"
                          : stats.credits < 150
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {stats.credits}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">1 credit = 1 lead</p>
                <p className="text-gray-500 text-xs mt-1">
                  New users get 500 free credits
                </p>
                <button
                  onClick={() => navigate("/create-job")}
                  className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                >
                  Use Credits →
                </button>
              </div>
            </div>
            {!loading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Credits used: {500 - stats.credits}</span>
                  <span>Total: 500</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stats.credits < 50
                        ? "bg-red-500"
                        : stats.credits < 150
                          ? "bg-yellow-500"
                          : "bg-gradient-to-r from-green-500 to-blue-500"
                    }`}
                    style={{
                      width: `${Math.min((stats.credits / 500) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-4 md:p-8 shadow-xl border border-white/5 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  Quick Stats
                </h3>
                {lastUpdated && (
                  <p className="text-gray-500 text-xs mt-1">
                    🔄 Auto-refreshing • Last updated:{" "}
                    {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {stats.active_jobs > 0 && (
                  <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-blue-400 text-xs font-medium">
                      {stats.active_jobs} Running
                    </span>
                  </div>
                )}
                <button
                  onClick={() => fetchStats()}
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-24 bg-gray-700 rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center bg-[#0f1221]/80 p-4 md:p-6 rounded-xl border border-white/5 relative overflow-hidden">
                  {stats.active_jobs > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                  )}
                  <p className="text-gray-400 text-xs mb-1">Active Jobs</p>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${stats.active_jobs > 0 ? "text-blue-400" : "text-white"}`}
                  >
                    {stats.active_jobs}
                  </p>
                  {stats.active_jobs > 0 && (
                    <p className="text-blue-400 text-xs mt-1 animate-pulse">
                      ● Live
                    </p>
                  )}
                </div>

                <div className="text-center bg-[#0f1221]/80 p-4 md:p-6 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-xs mb-1">Completed</p>
                  <p className="text-green-400 text-3xl md:text-4xl font-bold">
                    {stats.completed_jobs}
                  </p>
                </div>

                <div className="text-center bg-[#0f1221]/80 p-4 md:p-6 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-xs mb-1">Failed</p>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${stats.failed_jobs > 0 ? "text-red-400" : "text-white"}`}
                  >
                    {stats.failed_jobs || 0}
                  </p>
                </div>

                <div className="text-center bg-[#0f1221]/80 p-4 md:p-6 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-xs mb-1">Success Rate</p>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${
                      stats.success_rate >= 80
                        ? "text-green-400"
                        : stats.success_rate >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {stats.success_rate}%
                  </p>
                </div>
              </div>
            )}

            {stats.active_jobs > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => navigate("/history")}
                  className="w-full text-center text-blue-400 hover:text-blue-300 text-sm transition flex items-center justify-center gap-2"
                >
                  <span className="animate-pulse">●</span>
                  View {stats.active_jobs} active job
                  {stats.active_jobs > 1 ? "s" : ""} in History →
                </button>
              </div>
            )}
          </div>

          {!loading && stats.total_jobs === 0 && (
            <div className="text-center py-12 bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl border border-white/5">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to mine leads?
              </h3>
              <p className="text-gray-400 mb-6">
                Create your first scraping job to get started
              </p>
              <button
                onClick={() => navigate("/create-job")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                🎯 Create First Job
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
