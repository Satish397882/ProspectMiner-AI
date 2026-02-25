import { useState } from "react"
import api from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    const res = await api.post("/auth/login", { email, password })
    localStorage.setItem("token", res.data.token)
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input
          className="w-full p-3 mb-4 border rounded"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 mb-4 border rounded"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-black text-white py-3 rounded hover:bg-gray-800"
        >
          Login
        </button>
      </form>
    </div>
  )
}