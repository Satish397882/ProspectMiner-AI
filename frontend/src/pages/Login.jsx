import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          email,
          password,
        },
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setAuth(true); // Update App.jsx state
        setSuccess("Login successful!");
        setTimeout(() => navigate("/dashboard"), 500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials!");
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <div className="welcome-left">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="welcome-input-group">
              <i className="fas fa-user"></i>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="welcome-input-group">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="welcome-error">{error}</div>}
            {success && <div className="welcome-success">{success}</div>}

            <button type="submit" className="welcome-btn">
              Login
            </button>

            <div className="welcome-toggle">
              Don't have an account?
              <button type="button" onClick={() => navigate("/signup")}>
                Sign Up
              </button>
            </div>
          </form>
        </div>
        <div className="welcome-right">
          <h1>WELCOME</h1>
        </div>
      </div>
    </div>
  );
};

export default Login;
