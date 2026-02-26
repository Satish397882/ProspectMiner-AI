import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "10px 14px",
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 4px" }}>
          {label}
        </p>
        {payload.map((p, i) => (
          <p
            key={i}
            style={{
              color: p.color,
              fontSize: "13px",
              fontWeight: "600",
              margin: "2px 0",
            }}
          >
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex items-center gap-4">
    <div
      className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl"
      style={{ background: `${color}20`, width: 52, height: 52 }}
    >
      {icon}
    </div>
    <div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white text-3xl font-bold">{value}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-6 border border-white/5">
    <h3 className="text-white text-base font-semibold mb-5">{title}</h3>
    {children}
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8000/scrape/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <div className="min-h-screen bg-[#0a0d1a] relative overflow-hidden">
      <AnimatedBackground />

      <nav
        className="relative z-10 bg-[#1a1f3a]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center shadow-lg border-b border-white/5"
        style={{ position: "sticky", top: 0 }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <span className="text-xl">🎯</span>
          <span className="text-white font-bold text-lg">ProspectMiner</span>
        </div>
        <div className="hidden md:flex gap-2 items-center">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "New Job", path: "/create-job" },
            { label: "History", path: "/history" },
            { label: "Analytics", path: "/analytics" },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-1.5 rounded-lg text-sm transition border ${window.location.pathname === path ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm"
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
            className="text-gray-300 text-left py-2 border-b border-gray-700"
          >
            New Job
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
            className="text-white font-semibold text-left py-2 border-b border-gray-700"
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

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-indigo-400 text-xl animate-pulse">
              Loading analytics...
            </div>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Failed to load analytics</div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-white text-3xl font-bold mb-2">
                📊 Analytics
              </h1>
              <p className="text-gray-400">
                Track your scraping performance and insights
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="🎯"
                label="Total Jobs"
                value={data.summary.total_jobs}
                color="#6366f1"
              />
              <StatCard
                icon="✅"
                label="Completed"
                value={data.summary.completed_jobs}
                color="#10b981"
              />
              <StatCard
                icon="👥"
                label="Total Leads"
                value={data.summary.total_leads}
                color="#f59e0b"
              />
              <StatCard
                icon="📈"
                label="Avg Leads/Job"
                value={data.summary.avg_leads_per_job}
                color="#3b82f6"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartCard title="📈 Activity (Last 7 Days)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.jobs_over_time}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ fill: "#6366f1", r: 4 }}
                      name="Jobs"
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 4 }}
                      name="Leads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="🍩 Job Status Breakdown">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.donut_data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.donut_data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChartCard title="📊 Leads Per Job">
                {data.leads_per_job.length === 0 ? (
                  <div className="text-gray-500 text-center py-16">
                    No jobs yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.leads_per_job} barSize={20}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="leads"
                        name="Leads Found"
                        radius={[4, 4, 0, 0]}
                      >
                        {data.leads_per_job.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="🏆 Top Keywords">
                {data.top_keywords.length === 0 ? (
                  <div className="text-gray-500 text-center py-16">
                    No data yet
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pt-2">
                    {data.top_keywords.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-200 text-sm font-medium">
                            {item.keyword}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {item.count} jobs · {item.leads} leads
                          </span>
                        </div>
                        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{
                              width: `${(item.count / data.top_keywords[0].count) * 100}%`,
                              height: "100%",
                              background: COLORS[i % COLORS.length],
                              borderRadius: "999px",
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
