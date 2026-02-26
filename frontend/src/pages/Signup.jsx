import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let strength = "";
  let color = "";
  let width = "";

  if (password.length === 0) {
    strength = "";
    color = "";
    width = "0%";
  } else if (passed <= 2) {
    strength = "Weak";
    color = "#ef4444";
    width = "33%";
  } else if (passed <= 3) {
    strength = "Medium";
    color = "#f59e0b";
    width = "66%";
  } else {
    strength = "Strong";
    color = "#10b981";
    width = "100%";
  }

  return { checks, strength, color, width, passed };
};

const Signup = ({ setAuth }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const { checks, strength, color, width, passed } =
    getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passed < 4) {
      setError("Please choose a stronger password before signing up.");
      setTouched(true);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/register",
        { name, email, password },
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setAuth(true);
        setSuccess("Registration successful!");
        setTimeout(() => navigate("/dashboard"), 500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed!");
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <div className="welcome-left">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
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

            <div className="welcome-input-group">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password field with show/hide */}
            <div
              className="welcome-input-group"
              style={{ position: "relative" }}
            >
              <i className="fas fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched(true);
                }}
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  fontSize: "14px",
                  padding: "0",
                }}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>

            {/* Password strength bar */}
            {touched && password.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                {/* Strength bar */}
                <div
                  style={{
                    background: "#e5e7eb",
                    borderRadius: "999px",
                    height: "6px",
                    marginBottom: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: width,
                      height: "100%",
                      background: color,
                      borderRadius: "999px",
                      transition: "width 0.3s ease, background 0.3s ease",
                    }}
                  />
                </div>

                {/* Strength label */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    Password strength
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: color,
                    }}
                  >
                    {strength}
                  </span>
                </div>

                {/* Checklist */}
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 12px",
                  }}
                >
                  {[
                    { key: "length", label: "8+ characters" },
                    { key: "uppercase", label: "Uppercase letter" },
                    { key: "lowercase", label: "Lowercase letter" },
                    { key: "number", label: "Number" },
                    { key: "special", label: "Special character" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: checks[key] ? "#10b981" : "#9ca3af",
                        transition: "color 0.2s",
                      }}
                    >
                      <i
                        className={`fas ${checks[key] ? "fa-check-circle" : "fa-circle"}`}
                        style={{ fontSize: "11px" }}
                      ></i>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="welcome-error">{error}</div>}
            {success && <div className="welcome-success">{success}</div>}

            <button
              type="submit"
              className="welcome-btn"
              disabled={touched && passed < 4}
              style={{
                opacity: touched && passed < 4 ? 0.6 : 1,
                cursor: touched && passed < 4 ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              Sign Up
            </button>

            <div className="welcome-toggle">
              Already have an account?
              <button type="button" onClick={() => navigate("/login")}>
                Login
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

export default Signup;
