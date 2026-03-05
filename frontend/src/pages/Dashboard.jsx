import { useEffect, useState } from "react";

function Dashboard() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));

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
    syncUser();
  }, []);

  return (
    <div className="home-container">
      <h1>Welcome back{user ? `, ${user.name}` : ""}</h1>
    </div>
  );
}

export default Dashboard;
