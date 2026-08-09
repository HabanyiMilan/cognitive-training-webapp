import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "@/components/Toast.jsx";
import { Brain, Eye, Handshake, Flame } from "lucide-react";
import "../styles/Games.css";
import "../styles/Index.css";
import LoadingScreen from "../components/LoadingScreen.jsx";

function Games() {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState("Memory");
  const [toast, setToast] = useState("");
  const [games, setGames] = useState([]);
  const [popularGame, setPopularGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const handleStart = (game) => {
    console.log("START CLICKED");
    if (loading) return;
    let path = "";
    let text = "Loading...";

    if (game?.slug === "card-match") {
      path = "/games/card-match";
      text = "Shuffling Memory Sequences...";
    } 
    else if (game?.slug === "attention-flight") {
      path = "/games/attention-flight";
      text = "Preparing Attention Flight...";
    } else if (game?.slug === "power-flow") {
      path = "/games/power-flow";
      text = "Setting up Power Flow...";
    }

    if (!path) {
      setToast(`${game?.name ?? "Game"} launcher coming soon.`);
      return;
    }
    setLoading(true);
    console.log("LOADING TRUE");
    setLoadingText(text);
    setTimeout(() => {
      navigate(path);
    }, 3000);
  };
  const abilityMap = {
    "Memory": "MEMORY",
    "Attention": "ATTENTION",
    "Problem Solving": "PROBLEM_SOLVING"
  };

  useEffect(() => {
    const fetchGames = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
          console.error("No token found");
          return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:5000/games?ability=${abilityMap[activeTag]}`,
          {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          });
        const data = await res.json();
        setGames(data?.games ?? []);
      } catch (err) {
        console.error("Failed to load games", err);
        setGames([]);
      }
    };
    fetchGames();
  }, [activeTag, "http://127.0.0.1:5000"]);

  useEffect(() =>{
    const fetchPopularGame = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
          console.error("No token found");
          return;
      }
      try {
        const res = await fetch("http://127.0.0.1:5000/games/popular", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        setPopularGame(data?.popular_game ?? null);
      } catch (err) {
        console.error("Failed to find most popular game", err);
        setPopularGame(null);
      }
    }; fetchPopularGame();
  }, []);

  console.log("loading:", loading);
  if (loading) {
    console.log("LoadingScreen rendered");
    return <LoadingScreen text={loadingText} />
  }

  const currentGame = games[0];

  return (
    <div className="games-page">
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="games-panel">

      <div className="games-header">
        <h1>Games</h1>
      </div>

      <div className="games-layout">

          {/* LEFT PANEL */}

          <aside className="games-sidebar">

              <h3>Categories</h3>

              {Object.keys(abilityMap).map((tag) => {

                  const icon =
                      tag === "Memory"
                          ? <Brain size={20}/>
                          : tag === "Attention"
                          ? <Eye size={20}/>
                          : <Handshake size={20}/>;

                  return (
                      <button
                          key={tag}
                          className={`category-item ${
                              activeTag === tag ? "active" : ""
                          }`}
                          onClick={() => setActiveTag(tag)}
                      >
                          {icon}

                          <span>{tag}</span>
                      </button>
                  );
              })}

          </aside>

          {/* RIGHT PANEL */}

          {currentGame && (

              <section className="game-details">

                  <div className="hero-image">

                      <img
                          src={
                              currentGame.icon_path
                                  ? `/src/assets/images/${currentGame.icon_path}`
                                  : "/src/assets/images/Home.png"
                          }
                          alt={currentGame.name}
                      />

                  </div>

                  <h2 className="game-title">{currentGame.name}</h2>

                  <p className="game-description">
                      {currentGame.description}
                  </p>

                  <div className="game-footer">
                    <div className="game-info">
                        <div className="info-card">
                            Difficulty: {currentGame.recommended_difficulty}
                        </div>
                        <div className="info-card">
                            Last Played: {currentGame.last_played ? new Date(currentGame.last_played).toLocaleDateString() : "Never"}
                        </div>
                        {currentGame.id === popularGame?.id && (
                          <div className="info-card">
                              <Flame /> Popular Currently
                          </div>
                        )}
                    </div>
                    <button
                        className="start-btn"
                        onClick={() => handleStart(currentGame)}
                    >
                        Start Game
                    </button>
                  </div>
              </section>
          )}
        </div>
      </div>
  </div>
  );
}

export default Games;
