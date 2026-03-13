import { useEffect, useState } from "react";
import SplitText from "@/components/SplitText.jsx";
import Toast from "@/components/Toast.jsx";
import FloatingLines from "@/components/FloatingLines";
import "../styles/Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [toast, setToast] = useState("");

  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://127.0.0.1:5000/auth/me", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.ok) {
          const fresh = await res.json();
          localStorage.setItem("user", JSON.stringify(fresh));
          setUser(fresh);
        }
      } catch (err) {
        console.error("Failed to sync user", err);
      }
    };
    const loginMsg = localStorage.getItem("login_success");
    if (loginMsg) {
      setToast(loginMsg);
      localStorage.removeItem("login_success");
    }

    const saved = localStorage.getItem("assessment_success");
    if (saved) {
      setToast(saved);
      localStorage.removeItem("assessment_success");
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("assessment") === "fitbit_success") {
      setToast("Fitbit assessment imported successfully.");
      params.delete("assessment");
      const newUrl =
        window.location.pathname +
     (params.toString() ? `?${params.toString()}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }

    syncUser();
  }, []);

  return (
    <div className="wallpaper-wrapper">
      <div className="wallpaper-bg">
        <FloatingLines enabledWaves={["top", "middle", "bottom"]} lineCount={5} lineDistance={5} bendRadius={5} bendStrength={-0.5} interactive parallax/>
      </div>
      <div className="wallpaper-content text-white">
        <Toast message={toast} onClose={() => setToast("")} />
        <div className="dashboard-hero">
          <div className="dashboard-content">
            <SplitText
              text={`Welcome back${user ? `, ${user.name}` : ""}`}
              className="dashboard-title"
              delay={50}
              duration={1.25}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              showCallback
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
