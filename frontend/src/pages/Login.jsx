import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };

      const response = await axios.post(
        `http://localhost:8000${endpoint}`,
        payload,
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setSuccess(isLogin ? "Login successful!" : "Registration successful!");
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <div className="welcome-left">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="welcome-input-group">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="welcome-input-group">
              <i className="fas fa-user"></i>
              <input
                type="email"
                placeholder={isLogin ? "Username" : "Email"}
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
              {isLogin ? "Login" : "Sign Up"}
            </button>

            <div className="welcome-toggle">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button type="button" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign Up" : "Login"}
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
