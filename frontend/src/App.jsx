import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import JobProgress from "./pages/JobProgress";
import History from "./pages/JobHistory";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage immediately
    return !!localStorage.getItem("token");
  });

  // Listen for storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      console.log("Auth check - Token:", token ? "EXISTS" : "MISSING");
      setIsAuthenticated(!!token);
    };

    // Check on mount
    checkAuth();

    // Check when localStorage changes
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  console.log("App render - isAuthenticated:", isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route
          path="/signup"
          element={<Signup setAuth={setIsAuthenticated} />}
        />

        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/job/:jobId" element={<JobProgress />} />
            <Route path="/history" element={<History />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
