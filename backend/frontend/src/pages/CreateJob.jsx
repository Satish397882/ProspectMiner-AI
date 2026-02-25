import { useState } from "react"
import api from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function CreateJob() {
  const [keyword, setKeyword] = useState("")
  const navigate = useNavigate()

  const createJob = async () => {
    const res = await api.post("/jobs/create", { keyword })
    navigate(`/jobs/${res.data.jobId}`)
  }

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-xl font-bold mb-4">Create Scraping Job</h2>
      <input className="input" placeholder="Keyword (e.g. SaaS founders)" onChange={e => setKeyword(e.target.value)} />
      <button onClick={createJob} className="btn-primary mt-4">Start Scraping</button>
    </div>
  )
}