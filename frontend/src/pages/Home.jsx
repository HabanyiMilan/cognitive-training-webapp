import { useEffect, useState } from "react";
import SplitText from "@/components/SplitText.jsx";
import Toast from "@/components/Toast.jsx";
import "../styles/Home.css";

function Home() {
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
    <div className="text-white">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="home-hero">
        <div className="home-content">
          <SplitText
            text={`Welcome back${user ? `, ${user.name}` : ""}`}
            className="home-title"
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
  );
}

export default Home;
