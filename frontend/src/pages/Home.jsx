import { useEffect, useState } from "react";
import Toast from "@/components/Toast.jsx";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { ArrowLeft, ArrowRight, Flame } from "lucide-react"

function Home() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [toast, setToast] = useState("");
  const [games, setGames] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [weekActivity, setWeekActivity] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchGames = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/games",
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        });
        const data = await res.json();
        setGames(data.games ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchGames();
  }, []);

  const getGamePath = (game) => {
    switch (game.slug) {
          case "card-match":
              return "/games/card-match";

          case "attention-flight":
              return "/games/attention-flight";

          case "power-flow":
              return "/games/power-flow";

          default:
              return null;
      }
  };

  const handleSurprise = () => {
      if (loading) return;
      if (games.length === 0) return;
      let text = "Loading...";

      const randomGame = games[Math.floor(Math.random() * games.length)];

      const path = getGamePath(randomGame);

       if (!path) return;

      if (randomGame?.slug === "card-match") {
        text = "Shuffling Memory Sequences...";
      } 
      else if (randomGame?.slug === "attention-flight") {
        text = "Preparing Attention Flight...";
      } else if (randomGame?.slug === "power-flow") {
        text = "Setting up Power Flow...";
      }

      setLoading(true);
      setLoadingText(text);

      setTimeout(() => {
        navigate(path);
    }, 3000);
  };

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

  const fetchWeekActivity = async (offset = 0) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`http://127.0.0.1:5000/profile/activity/week?offset=${offset}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch week activity");
      }
      const data = await res.json();
      setWeekActivity(data);
    } catch (err) {
      console.error("Failed to fetch week activity", err);
    }
  };

  useEffect(() => {
    fetchWeekActivity(weekOffset);
  }, [weekOffset]);

  const formatWeekRange = (start, end) => {
    if (!start || !end) return "";

    const startDate = new Date(start);
    const endDate = new Date(end);

    return `${startDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })}`;
  };

  const formatWeekDay = (date) =>
    new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
    });

  const formatDayNumber = (date) =>
      new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
      });

  if (loading) {
    return <LoadingScreen text={loadingText} />
  }

  return (
    <div className="home-page">
      <Toast message={toast} onClose={() => setToast("")} />

      <section className="hero-wrapper">

        <div className="hero-card">

          <div className="hero-content">

            <div className="hero-left">

              <div className="hero-title">
                <span className="hero-line">
                  Welcome back,
                </span>

                <span className="hero-name">
                  {user?.name || "Player"}
                </span>
              </div>

              <p className="hero-description">
                Challenge your memory, attention and problem-solving
                skills with interactive cognitive games.
              </p>
              <div className="hero-buttons">
                <button
                  className="hero-button primary"
                  onClick={() => navigate("/games")}
                >
                  Explore Games
                </button>
                <button
                  className="hero-button secondary"
                  onClick={handleSurprise}
                >
                  Surprise Me!
                </button>
              </div>

            </div>

            <div className="hero-right">
              <div className="week-activity-header">
                <button onClick={() => setWeekOffset(prev => prev - 1)}>
                  <ArrowLeft />
                </button>
                <h3>
                    {weekActivity &&
                        formatWeekRange(
                            weekActivity.week_start,
                            weekActivity.week_end
                        )}
                </h3>
                <button disabled={weekOffset === 0} onClick={() => setWeekOffset(prev => prev + 1)}>
                  <ArrowRight />
                </button>
              </div>
              <div className="week-grid">
                {weekActivity?.days.map(day => (
                  <div className={`day-card ${day.today ? "today" : ""}`} key={day.date} onMouseMove={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, day, })} onMouseLeave={() => setTooltip(null)}>
                    {day.today && (
                        <div className="today-label">
                            TODAY
                        </div>
                    )}
                    <div className="day-name">
                      {formatWeekDay(day.date)}
                    </div>
                    <div className="energy-column">
                      {[7,6,5,4,3,2,1,0].map(i => (
                          <div
                              key={i}
                              className={`energy-segment ${
                                  day.future
                                    ? "future"
                                    : i < Math.min(day.count, 8)
                                        ? "filled"
                                        : "empty"
                              }`}
                          />
                      ))}
                    </div>
                    <div className="day-date">
                      {formatDayNumber(day.date)}
                    </div>
                  </div>
                ))}
                {tooltip && (
                      <div
                          className="floating-tooltip"
                          style={{
                              left: tooltip.x + 18,
                              top: tooltip.y + 18,
                          }}
                      >
                          {tooltip.day.future
                              ? "Future Day"
                              : `${tooltip.day.count} Session${tooltip.day.count !== 1 ? "s" : ""} Completed`}
                      </div>
                    )}
              </div>
              <div className="streak-chip">
                  <Flame size={18} color="#ff8a3d" />
                  <span>{user?.streak + " Day Streak" || "Start playing!"}</span>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
