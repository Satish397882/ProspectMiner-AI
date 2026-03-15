import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LeadsTable from "../components/LeadsTable";
import Navbar from "../components/Navbar";

const API = "http://localhost:5000/api";
const PYTHON_API = "http://localhost:8000";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const isUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getLeadScoreFromRating = (rating) => {
  if (!rating) return "cold";
  const r = parseFloat(rating);
  if (r >= 4.5) return "hot";
  if (r >= 3.5) return "warm";
  return "cold";
};

function FilterBar({ filters, setFilters, onReset }) {
  return (
    <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-4 border border-white/5 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Name, phone, address..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs text-gray-500 mb-1">Min Rating</label>
          <select
            value={filters.rating}
            onChange={(e) =>
              setFilters((f) => ({ ...f, rating: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">Any Rating</option>
            <option value="4.5">★ 4.5+</option>
            <option value="4.0">★ 4.0+</option>
            <option value="3.5">★ 3.5+</option>
            <option value="3.0">★ 3.0+</option>
          </select>
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs text-gray-500 mb-1">Per page</label>
          <select
            value={filters.limit}
            onChange={(e) =>
              setFilters((f) => ({ ...f, limit: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
        >
          ✕ Reset
        </button>
      </div>
    </div>
  );
}

function FilterBarNode({ filters, setFilters, categories, onReset }) {
  return (
    <div className="bg-[#1a1f3a]/70 backdrop-blur-md rounded-2xl p-4 border border-white/5 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Name, email, phone, address..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px]">
          <label className="block text-xs text-gray-500 mb-1">Lead Score</label>
          <select
            value={filters.leadScore}
            onChange={(e) =>
              setFilters((f) => ({ ...f, leadScore: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">All Scores</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🌤 Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs text-gray-500 mb-1">Min Rating</label>
          <select
            value={filters.rating}
            onChange={(e) =>
              setFilters((f) => ({ ...f, rating: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">Any Rating</option>
            <option value="4.5">★ 4.5+</option>
            <option value="4.0">★ 4.0+</option>
            <option value="3.5">★ 3.5+</option>
            <option value="3.0">★ 3.0+</option>
          </select>
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs text-gray-500 mb-1">Per page</label>
          <select
            value={filters.limit}
            onChange={(e) =>
              setFilters((f) => ({ ...f, limit: e.target.value, page: 1 }))
            }
            className="w-full bg-[#0f1221] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
        >
          ✕ Reset
        </button>
      </div>
    </div>
  );
}

function StatsCards({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-[#1a1f3a]/70 rounded-2xl p-4 border border-white/5">
        <p className="text-gray-500 text-xs mb-1">Total Leads</p>
        <p className="text-white text-2xl font-bold">{stats.totalLeads}</p>
      </div>
      <div className="bg-[#1a1f3a]/70 rounded-2xl p-4 border border-white/5">
        <p className="text-gray-500 text-xs mb-1">🔥 Hot Leads</p>
        <p className="text-red-400 text-2xl font-bold">
          {stats.scores?.hot || 0}
        </p>
      </div>
      <div className="bg-[#1a1f3a]/70 rounded-2xl p-4 border border-white/5">
        <p className="text-gray-500 text-xs mb-1">Avg Rating</p>
        <p className="text-yellow-400 text-2xl font-bold">
          {stats.rating?.avg ? `★ ${stats.rating.avg}` : "—"}
        </p>
      </div>
      <div className="bg-[#1a1f3a]/70 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
        <p className="text-gray-500 text-xs mb-1">Enriched</p>
        <p className="text-purple-400 text-2xl font-bold">
          {stats.enrichmentProgress}%
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${stats.enrichmentProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { currentPage, totalPages, totalLeads, limit } = pagination;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-white/5">
      <p className="text-gray-500 text-xs">
        Showing {(currentPage - 1) * limit + 1}–
        {Math.min(currentPage * limit, totalLeads)} of {totalLeads} leads
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-1.5 text-sm rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page;
            if (totalPages <= 5) page = i + 1;
            else if (currentPage <= 3) page = i + 1;
            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
            else page = currentPage - 2 + i;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                  page === currentPage
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="px-3 py-1.5 text-sm rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  leadScore: "",
  rating: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: "25",
};

export default function Leads() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [enrichingLeadIds, setEnrichingLeadIds] = useState(new Set());
  const [enrichmentTriggered, setEnrichmentTriggered] = useState(false);
  const [job, setJob] = useState(null);
  const [isPythonJob, setIsPythonJob] = useState(false);

  const sseRef = useRef(null);
  const debounceRef = useRef(null);
  const statsIntervalRef = useRef(null);

  const normalizePythonLeads = (rawLeads) => {
    return rawLeads.map((l, i) => ({
      _id: `python-${i}`,
      businessName: l.name || "Unknown",
      phone: l.phone || null,
      email: l.email || null,
      website: l.website || null,
      rating: l.rating ? parseFloat(l.rating) : null,
      address: l.address || null,
      category: l.category || null,
      leadScore: l.lead_score || getLeadScoreFromRating(l.rating),
      enriched: false,
    }));
  };

  const applyClientFilters = (normalized, f) => {
    let filtered = [...normalized];
    if (f.search) {
      const s = f.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.businessName || "").toLowerCase().includes(s) ||
          (l.phone || "").includes(s) ||
          (l.address || "").toLowerCase().includes(s),
      );
    }
    if (f.rating) {
      filtered = filtered.filter(
        (l) => l.rating && l.rating >= parseFloat(f.rating),
      );
    }
    return filtered;
  };

  const fetchPythonJobLeads = useCallback(
    async (f = filters) => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(`${PYTHON_API}/scrape/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch Python job");
        const data = await res.json();

        const normalized = normalizePythonLeads(data.leads || []);
        setAllLeads(normalized);

        const filtered = applyClientFilters(normalized, f);
        const totalLeads = filtered.length;
        const limit = parseInt(f.limit);
        const page = f.page;
        const totalPages = Math.ceil(totalLeads / limit);
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        setLeads(paginated);
        setPagination({
          currentPage: page,
          totalPages,
          totalLeads,
          limit,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        });

        const hotCount = normalized.filter((l) => l.leadScore === "hot").length;
        const warmCount = normalized.filter(
          (l) => l.leadScore === "warm",
        ).length;
        const coldCount = normalized.filter(
          (l) => l.leadScore === "cold",
        ).length;
        const ratings = normalized.filter((l) => l.rating).map((l) => l.rating);
        const avgRating = ratings.length
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : null;

        setStats({
          totalLeads: normalized.length,
          enrichedLeads: 0,
          enrichmentProgress: 0,
          scores: { hot: hotCount, warm: warmCount, cold: coldCount },
          rating: { avg: avgRating },
          categories: [],
        });

        setJob({ keyword: data.keyword, location: data.location });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [jobId],
  );

  const fetchLeads = useCallback(
    async (f = filters) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: f.page,
          limit: f.limit,
          sortBy: f.sortBy,
          sortOrder: f.sortOrder,
          ...(f.search && { search: f.search }),
          ...(f.category && { category: f.category }),
          ...(f.leadScore && { leadScore: f.leadScore }),
          ...(f.rating && { rating: f.rating }),
        });
        const res = await fetch(`${API}/leads/${jobId}?${params}`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch leads");
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [jobId],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/leads/${jobId}/stats`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch {}
  }, [jobId]);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`${API}/jobs/${jobId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setJob(data.job);
    } catch {}
  }, [jobId]);

  useEffect(() => {
    const python = isUUID(jobId);
    setIsPythonJob(python);
    if (python) {
      fetchPythonJobLeads(DEFAULT_FILTERS);
    } else {
      fetchLeads();
      fetchStats();
      fetchJob();
      statsIntervalRef.current = setInterval(() => {
        fetchStats();
      }, 5000);
    }
    return () => {
      clearInterval(statsIntervalRef.current);
    };
  }, [jobId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isPythonJob) {
        fetchPythonJobLeads(filters);
      } else {
        fetchLeads(filters);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  useEffect(() => {
    if (isPythonJob) return;
    const token = getToken();
    const url = `${API.replace("/api", "")}/api/sse/${jobId}/enrichment`;
    const es = new EventSource(`${url}?token=${token}`);
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "enrichment_update") {
        const { leadId } = msg.data;
        setEnrichingLeadIds((prev) => new Set([...prev, leadId]));
        setTimeout(() => {
          setEnrichingLeadIds((prev) => {
            const next = new Set(prev);
            next.delete(leadId);
            return next;
          });
          setLeads((prev) =>
            prev.map((l) =>
              l._id === leadId ? { ...l, ...msg.data, enriched: true } : l,
            ),
          );
          fetchStats();
        }, 1500);
      }
    };
    sseRef.current = es;
    return () => es.close();
  }, [jobId, isPythonJob]);

  const handleSort = (field) => {
    setFilters((f) => ({
      ...f,
      sortBy: field,
      sortOrder: f.sortBy === field && f.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  const triggerEnrichment = async () => {
    try {
      const res = await fetch(`${API}/leads/${jobId}/enrich`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setEnrichmentTriggered(true);
      alert(`✅ ${data.message}`);
    } catch {
      alert("❌ Failed to trigger enrichment");
    }
  };

  const exportCSV = async () => {
    if (isPythonJob) {
      // Python job — client side filtered leads
      const exportLeads = applyClientFilters(allLeads, filters);
      if (!exportLeads.length) return alert("No leads to export!");

      const headers = [
        "Business Name",
        "Phone",
        "Email",
        "Website",
        "Rating",
        "Category",
        "Lead Score",
        "Address",
      ];
      const rows = exportLeads.map((l) =>
        [
          l.businessName,
          l.phone || "",
          l.email || "",
          l.website || "",
          l.rating || "",
          l.category || "",
          l.leadScore,
          l.address || "",
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`),
      );
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${jobId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js job — fetch ALL filtered leads from backend
      try {
        setExporting(true);
        const params = new URLSearchParams({
          page: 1,
          limit: 10000,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...(filters.search && { search: filters.search }),
          ...(filters.category && { category: filters.category }),
          ...(filters.leadScore && { leadScore: filters.leadScore }),
          ...(filters.rating && { rating: filters.rating }),
        });

        const res = await fetch(`${API}/leads/${jobId}?${params}`, {
          headers: authHeaders(),
        });
        if (!res.ok) return alert("Failed to fetch leads for export");
        const data = await res.json();
        const exportLeads = data.leads || [];

        if (!exportLeads.length) return alert("No leads to export!");

        const headers = [
          "Business Name",
          "Phone",
          "Email",
          "Website",
          "Rating",
          "Category",
          "Lead Score",
          "Address",
        ];
        const rows = exportLeads.map((l) =>
          [
            l.businessName,
            l.phone || "",
            l.email || "",
            l.website || "",
            l.rating || "",
            l.category || "",
            l.leadScore,
            l.address || "",
          ].map((v) => `"${String(v).replace(/"/g, '""')}"`),
        );
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
          "\n",
        );
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads_${jobId.slice(0, 8)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        alert("❌ Export failed");
      } finally {
        setExporting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1a]">
      <Navbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-300 text-sm mb-2 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Leads</h2>
            {job && (
              <p className="text-gray-400 text-sm mt-1">
                🔍 {job.keyword} in {job.location}
              </p>
            )}
            {isPythonJob && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-full mt-1 inline-block">
                Legacy Job — Enrichment not available
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!isPythonJob &&
              stats &&
              stats.enrichedLeads < stats.totalLeads && (
                <button
                  onClick={triggerEnrichment}
                  disabled={enrichmentTriggered}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🤖 {enrichmentTriggered ? "Enriching…" : "Enrich All"}
                </button>
              )}
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? "⏳ Exporting..." : "📥 Export CSV"}
            </button>
          </div>
        </div>

        <StatsCards stats={stats} />

        {isPythonJob ? (
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : (
          <FilterBarNode
            filters={filters}
            setFilters={setFilters}
            categories={stats?.categories || []}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        )}

        {(filters.search ||
          filters.category ||
          filters.leadScore ||
          filters.rating) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.search && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                Search: {filters.search}
              </span>
            )}
            {filters.category && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                Category: {filters.category}
              </span>
            )}
            {filters.leadScore && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                Score: {filters.leadScore}
              </span>
            )}
            {filters.rating && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                Rating ≥ {filters.rating}
              </span>
            )}
          </div>
        )}

        <LeadsTable
          leads={leads}
          loading={loading}
          enrichingLeadIds={enrichingLeadIds}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
        />

        <Pagination
          pagination={pagination}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      </div>
    </div>
  );
}
