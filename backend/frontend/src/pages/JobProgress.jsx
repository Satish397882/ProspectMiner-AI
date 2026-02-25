import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../api/axios"
import useSSE from "../hooks/useSSE"
import Loader from "../components/Loader"

export default function JobProgress() {
  const { jobId } = useParams()

  const [progress, setProgress] = useState(0)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ LIVE PROGRESS (SSE)
  useSSE(
    `http://localhost:5000/jobs/${jobId}/stream`,
    (data) => {
      setProgress(data.progress)
      if (data.status === "completed") {
        setLoading(false)
        fetchLeads()
      }
    }
  )

  // ✅ FETCH LEADS AFTER JOB COMPLETES
  const fetchLeads = async () => {
    const res = await api.get(`/leads/${jobId}`)
    setLeads(res.data)
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Job Progress</h2>

      {/* ✅ LOADING STATE */}
      {loading && <Loader />}

      {/* ✅ PROGRESS BAR */}
      <div className="w-full bg-gray-200 rounded h-3">
        <div
          className="bg-blue-600 h-3 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ✅ EMPTY STATE */}
      {!loading && leads.length === 0 && (
        <p>No leads found</p>
      )}

      {/* ✅ LEADS TABLE */}
      {leads.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Company</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l._id} className="border-t">
                  <td className="p-2">{l.name}</td>
                  <td className="p-2">{l.email}</td>
                  <td className="p-2">{l.company}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}