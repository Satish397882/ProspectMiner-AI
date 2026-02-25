import { useEffect, useState } from "react"
import api from "../api/axios"
import StatusCard from "../components/StatusCard"

export default function JobHistory() {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    api.get("/jobs").then(res => setJobs(res.data))
  }, [])

  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      {jobs.map(job => (
        <StatusCard
          key={job._id}
          title={job.keyword}
          value={job.status}
        />
      ))}
    </div>
  )
}