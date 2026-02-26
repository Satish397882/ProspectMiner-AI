import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ keyword: "", location: "", leads: 50 });
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.keyword.trim()) e.keyword = "Keyword is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (form.leads < 1 || form.leads > 200) e.leads = "Enter between 1 and 200";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/scrape/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      navigate(`/job/${data.job_id}`);
    } catch {
      setLoading(false);
      alert("Failed to start job. Is backend running?");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const quickFills = [
    { keyword: "Restaurants", location: "Delhi" },
    { keyword: "Cafes", location: "Mumbai" },
    { keyword: "Gyms", location: "Bangalore" },
    { keyword: "Hotels", location: "Jaipur" },
  ];

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
            className="text-white font-semibold border-b-2 border-blue-500 pb-1"
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
            className="text-white font-semibold text-left py-2 border-b border-gray-700"
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

      <div className="relative z-10 p-4 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
            Create New Job 🎯
          </h2>
          <p className="text-gray-400">
            Scrape leads from Google Maps in seconds
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-3">⚡ Quick fill:</p>
          <div className="flex flex-wrap gap-2">
            {quickFills.map((q, i) => (
              <button
                key={i}
                onClick={() =>
                  setForm({ ...form, keyword: q.keyword, location: q.location })
                }
                className="bg-[#1a1f3a]/70 backdrop-blur-md hover:bg-[#252b4a] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition border border-white/10 hover:border-blue-500"
              >
                {q.keyword}, {q.location}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl space-y-6 border border-white/5">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              🔍 Keyword / Business Type
            </label>
            <input
              type="text"
              placeholder="e.g. Restaurants, Cafes, Gyms..."
              value={form.keyword}
              onChange={(e) => {
                setForm({ ...form, keyword: e.target.value });
                setErrors({ ...errors, keyword: "" });
              }}
              className={`w-full bg-[#0f1221]/80 text-white placeholder-gray-500 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.keyword ? "border-red-500" : "border-white/10 hover:border-white/20"}`}
            />
            {errors.keyword && (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.keyword}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              📍 Location / City
            </label>
            <input
              type="text"
              placeholder="e.g. Delhi, Mumbai, Bangalore..."
              value={form.location}
              onChange={(e) => {
                setForm({ ...form, location: e.target.value });
                setErrors({ ...errors, location: "" });
              }}
              className={`w-full bg-[#0f1221]/80 text-white placeholder-gray-500 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.location ? "border-red-500" : "border-white/10 hover:border-white/20"}`}
            />
            {errors.location && (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.location}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              📊 Number of Leads:{" "}
              <span className="text-blue-400 font-bold">{form.leads}</span>
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={form.leads}
              onChange={(e) =>
                setForm({ ...form, leads: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-gray-500 text-xs mt-1">
              <span>10</span>
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>200</span>
            </div>
            {errors.leads && (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.leads}</p>
            )}
          </div>

          {form.keyword && form.location && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm">
                🚀 Will scrape{" "}
                <span className="font-bold text-white">{form.leads} leads</span>{" "}
                for{" "}
                <span className="font-bold text-white">"{form.keyword}"</span>{" "}
                in <span className="font-bold text-white">{form.location}</span>
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition transform active:scale-95 ${
              loading
                ? "bg-gray-600 cursor-not-allowed text-gray-400"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white shadow-lg hover:shadow-blue-500/25"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting Job...
              </span>
            ) : (
              "🚀 Start Scraping"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
