import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function AuthBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      color: ["69,243,255", "31,64,104", "69,243,255"][
        Math.floor(Math.random() * 3)
      ],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(69,243,255,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(69,243,255,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let strength = "",
    color = "",
    width = "";
  if (password.length === 0) {
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
    <>
      <AuthBackground />
      <div
        className="welcome-container"
        style={{ position: "relative", zIndex: 1 }}
      >
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

              {touched && password.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
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
                        width,
                        height: "100%",
                        background: color,
                        borderRadius: "999px",
                        transition: "width 0.3s ease, background 0.3s ease",
                      }}
                    />
                  </div>
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
                      style={{ fontSize: "12px", fontWeight: "600", color }}
                    >
                      {strength}
                    </span>
                  </div>
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
    </>
  );
};

export default Signup;
