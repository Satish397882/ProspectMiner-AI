import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const Navbar = ({ menuOpen, setMenuOpen }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };
  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "22px" }}>🎯</span>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "18px" }}>
          ProspectMiner
        </span>
      </div>
      <div
        className="nav-links"
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
      >
        {[
          { label: "Dashboard", path: "/dashboard" },
          { label: "New Job", path: "/create-job" },
          { label: "History", path: "/history" },
          { label: "Analytics", path: "/analytics" },
        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              background:
                window.location.pathname === path
                  ? "rgba(99,102,241,0.2)"
                  : "transparent",
              border:
                window.location.pathname === path
                  ? "1px solid rgba(99,102,241,0.5)"
                  : "1px solid transparent",
              color: window.location.pathname === path ? "#818cf8" : "#94a3b8",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            marginLeft: "8px",
          }}
        >
          Logout
        </button>
      </div>
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "22px",
          cursor: "pointer",
        }}
      >
        ☰
      </button>
    </nav>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #1e293b, #0f172a)",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}
  >
    <div
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "14px",
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "700" }}>
        {value}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #1e293b, #0f172a)",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid rgba(255,255,255,0.07)",
    }}
  >
    <h3
      style={{
        color: "#f1f5f9",
        fontSize: "15px",
        fontWeight: "600",
        margin: "0 0 20px 0",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

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

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#6366f1", fontSize: "18px" }}>
          Loading analytics...
        </div>
      </div>
    );
  if (!data)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#ef4444" }}>Failed to load analytics</div>
      </div>
    );

  const COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      <style>{`
        @media (max-width: 768px) { .nav-links { display: none !important; } .hamburger { display: block !important; } .stats-grid { grid-template-columns: 1fr 1fr !important; } .charts-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              color: "#f1f5f9",
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px",
            }}
          >
            📊 Analytics
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Track your scraping performance and insights
          </p>
        </div>

        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
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

        <div
          className="charts-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
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

        <div
          className="charts-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <ChartCard title="📊 Leads Per Job">
            {data.leads_per_job.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  padding: "60px 0",
                }}
              >
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
                  <Bar dataKey="leads" name="Leads Found" radius={[4, 4, 0, 0]}>
                    {data.leads_per_job.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="🏆 Top Keywords">
            {data.top_keywords.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  padding: "60px 0",
                }}
              >
                No data yet
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  paddingTop: "8px",
                }}
              >
                {data.top_keywords.map((item, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "#e2e8f0",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {item.keyword}
                      </span>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {item.count} jobs · {item.leads} leads
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "999px",
                        height: "6px",
                        overflow: "hidden",
                      }}
                    >
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
      </div>
    </div>
  );
}
