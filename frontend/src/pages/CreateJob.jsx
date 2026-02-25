import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function CreateJob() {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [leads, setLeads] = useState(50);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createJob = async () => {
    setLoading(true);
    try {
      const res = await api.post("/scrape/", {
        keyword,
        location: city,
        leads,
      });
      navigate(`/jobs/${res.data.job_id}`, {
        state: { leads: res.data.leads },
      });
    } catch (err) {
      alert("Failed to create job!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1221] p-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Create Scraping Job
      </h1>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            What are you looking for? <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Restaurants"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <p className="text-gray-400 text-sm mt-1">
            Enter the type of business or professionals you want to find
          </p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Where? <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Delhi"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <p className="text-gray-400 text-sm mt-1">
            City or area where you want to search
          </p>
        </div>
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">
            Number of Leads: {leads}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={leads}
            onChange={(e) => setLeads(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="relative flex text-gray-400 text-sm mt-1 h-5">
            <span className="absolute left-0">10</span>
            <span className="absolute left-1/4 -translate-x-1/2">50</span>
            <span className="absolute left-2/3 -translate-x-1/2">100</span>
            <span className="absolute right-0">200</span>
          </div>
        </div>
        <button
          onClick={createJob}
          disabled={loading || !keyword || !city}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-60 hover:bg-blue-700 transition-colors mt-4"
        >
          {loading ? "Creating Job..." : "Start Scraping"}
        </button>
      </div>
      <div className="max-w-2xl mx-auto mt-6 bg-blue-50 rounded-2xl p-6">
        <h3 className="text-blue-700 font-bold text-lg mb-3">
          What happens next?
        </h3>
        <ul className="text-blue-600 space-y-2">
          <li>✓ We'll scrape Google Maps for your keywords</li>
          <li>✓ Extract business info (name, phone, website, rating)</li>
          <li>✓ Visit websites to find emails</li>
          <li>✓ Score leads as Hot, Warm, or Cold</li>
        </ul>
      </div>
    </div>
  );
}
