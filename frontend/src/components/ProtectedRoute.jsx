import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!token) {
      setStatus("deny");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.has_assessment) {
      setStatus("allow");
      return;
    }

    const syncUser = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/auth/me", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.ok) {
          const fresh = await res.json();
          localStorage.setItem("user", JSON.stringify(fresh));
          setStatus(fresh.has_assessment ? "allow" : "needAssessment");
        } else {
          setStatus("deny");
        }
      } catch {
        setStatus("deny");
      }
    };

    syncUser();
  }, [token]);

  if (status === "checking") return null;
  if (status === "deny") return <Navigate to="/" replace />;
  if (status === "needAssessment") return <Navigate to="/assessment" replace />;
  return children;
}

export default ProtectedRoute;
