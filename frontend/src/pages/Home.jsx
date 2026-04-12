import { useEffect, useState } from "react";
import SplitText from "@/components/SplitText.jsx";
import Toast from "@/components/Toast.jsx";
import "../styles/Home.css";
import { Cell } from "recharts";
import { BarChart, Bar, XAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Flame, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [toast, setToast] = useState("");
  const [weekData, setWeekData] = useState([]);
  const navigate = useNavigate();
  const [randomGame, setRandomGame] = useState(null);

  useEffect(() => {
  const fetchGame = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://127.0.0.1:5000/games", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json();
    const games = data.games;
    console.log("Fetched games:", games);

    if (games.length > 0) {
      const random = games[Math.floor(Math.random() * games.length)];
      setRandomGame(random);
    }
  };

  fetchGame();
}, []);

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
  
  useEffect(() => {
    const fetchWeek = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://127.0.0.1:5000/profile/activity/week", {
          headers: { Authorization: "Bearer " + token },
        });

        if (!res.ok) throw new Error("Failed to fetch week activity");

        const data = await res.json();
        setWeekData(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWeek();
  }, []);

  const getStreakMessage = (streak) => {
    if (streak === 0) return "Start your journey — consistency is key.";
    if (streak < 5) return "Good start, keep showing up daily!";
    if (streak < 10) return "You're building momentum!";
    if (streak < 20) return "Impressive consistency, keep pushing!";
    return "You're unstoppable. Elite discipline.";
  };

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const chartData = weekData.map((day, i) => ({
  name: days[i],
  value: 1,
  played: day.played
}));

  const handleCardClick = () => {
    navigate("/games");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div className="home-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="home-hero">
        <div className="home-card">
          <div className="card-headline">
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

          <div className="card-grid">
            <div className="card-left">
              <div className="chart-block">
                <section className="card chart-card">
                <div className="eyebrow">
                  <span className="dot primary" />
                  <span>Weekly Activity</span>
                </div>
                  {chartData.length ? (
                    <div className="modern-bar-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                          <XAxis dataKey="name" tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false}/>
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={48}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.played ? "#27c3ff" : "#2f3c59"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="muted">No data yet</p>
                  )}
                </section>
              </div>

              <div className="streak-row">
                <div className="streak-chip">
                  <Flame size={18} color="#ff8a3d" />
                  <span>{user?.streak || 0} Day Streak</span>
                  <div className="streak-note">
                    ({getStreakMessage(user?.streak || 0)})
                  </div>
                </div>
              </div>
              <div className="streak-row">
                <div className="home-text">
                  <Gamepad2 size={18} color="#27c3ff" />
                  <span>{user?.last_active ? `Last time you played: ${new Date(user.last_active).toLocaleDateString()}` : "No recent activity."}</span>
                </div>
              </div>
            </div>

            <div className="card-right">
              <div className="visual-frame" tabIndex={0} onClick={handleCardClick} onKeyDown={handleKeyDown}>
                <img src={randomGame?.icon_path ? `/src/assets/images/${randomGame.icon_path}` : "/src/assets/images/Home.png"} alt={randomGame?.name || "Game preview"}/>
                <div className="cta-text">Get Started</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}

export default Home;
