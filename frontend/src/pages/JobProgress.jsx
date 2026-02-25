import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function JobProgress() {
  const { jobId } = useParams();
  const location = useLocation();
  const [leads, setLeads] = useState(location.state?.leads || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await api.get(`/scrape/${jobId}`);
        if (res.data.leads) {
          setLeads(res.data.leads);
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-[#0f1221] p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Job Results</h2>

      {loading && (
        <div className="text-white text-center mt-20 text-xl">
          Loading results...
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="text-gray-400 text-center mt-20 text-xl">
          No leads found
        </div>
      )}

      {leads.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Website</th>
                <th className="p-4 text-left">Rating</th>
                <th className="p-4 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-4">{lead.name || "-"}</td>
                  <td className="p-4">{lead.phone || "-"}</td>
                  <td className="p-4">{lead.website || "-"}</td>
                  <td className="p-4">{lead.rating || "-"}</td>
                  <td className="p-4">{lead.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
