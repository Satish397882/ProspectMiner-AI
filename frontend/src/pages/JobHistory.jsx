import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JobHistory() {
  const navigate = useNavigate();

  // Dummy data for now
  const jobs = [
    {
      id: 1,
      keyword: "Restaurants",
      location: "Delhi",
      leads: 10,
      status: "Completed",
      date: "2026-02-25",
    },
    {
      id: 2,
      keyword: "Hotels",
      location: "Mumbai",
      leads: 20,
      status: "Completed",
      date: "2026-02-24",
    },
    {
      id: 3,
      keyword: "Cafes",
      location: "Bangalore",
      leads: 15,
      status: "Completed",
      date: "2026-02-23",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1221] p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Job History</h1>

      {jobs.length === 0 && (
        <div className="text-gray-400 text-center mt-20 text-xl">
          No jobs yet.{" "}
          <a href="/create" className="text-blue-400 underline">
            Create your first job!
          </a>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Keyword</th>
                <th className="p-4 text-left">Location</th>
                <th className="p-4 text-left">Leads</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium">{job.keyword}</td>
                  <td className="p-4">{job.location}</td>
                  <td className="p-4">{job.leads}</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{job.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
