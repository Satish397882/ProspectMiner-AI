import { useState } from "react"
import api from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    await api.post("/auth/signup", { email, password })
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>

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

        <button className="w-full bg-black text-white py-3 rounded hover:bg-gray-800">
          Sign up
        </button>
      </form>
    </div>
  )
}