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
  const [toast, setToast] = useState(null);
  const [games, setGames] = useState([]);
  const [popularGame, setPopularGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" }
  ];
  const handleStart = (game, difficulty) => {
    console.log("START CLICKED");

    if (loading) return;

    let path = "";

    if (game?.slug === "card-match") {
      path = "/games/card-match";
    } 
    else if (game?.slug === "attention-flight") {
      path = "/games/attention-flight";
    } else if (game?.slug === "power-flow") {
      path = "/games/power-flow";
    }

    if (!path) {
      setToast({ message:`${game?.name ?? "Game"} launcher coming soon.`, type:"error" });
      return;
    }
    
    navigate(`${path}?difficulty=${difficulty}`);
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
          setToast({ message:"No token found", type:"error" })
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
        setToast({ message:"Failed to load games", type:"error" })
        setGames([]);
      }
    };
    fetchGames();
  }, [activeTag, "http://127.0.0.1:5000"]);

  const currentGame = games[0];

  useEffect(() => {
    if (currentGame?.recommended_difficulty) {
      setSelectedDifficulty(
        currentGame.recommended_difficulty.toLowerCase()
      );
    }
  }, [currentGame?.id]);

  useEffect(() =>{
    const fetchPopularGame = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
          console.error("No token found");
          setToast({ message:"No token found", type:"error" })
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
        setToast({ message:"Failed to find most popular game", type:"error" })
        setPopularGame(null);
      }
    }; fetchPopularGame();
  }, []);

  console.log("loading:", loading);
  if (loading) {
    console.log("LoadingScreen rendered");
    return <LoadingScreen text={loadingText} />
  }

  return (
    <div className="games-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

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
                            Last Played: {currentGame.last_played ? new Date(currentGame.last_played).toLocaleDateString() : "Never"}
                        </div>
                        {currentGame.id === popularGame?.id && (
                          <div className="info-card">
                              <Flame /> Popular Currently
                          </div>
                        )}
                    </div>
                    
                    <div className="game-actions">
                      <div className="difficulty-wrapper">
                          <button className={`difficulty-trigger ${difficultyOpen ? "open" : ""}`} onClick={() => setDifficultyOpen(prev => !prev)}>
                              <span className="difficulty-trigger-label">
                                Difficulty:
                              </span>

                              <span className="difficulty-trigger-value">
                                {selectedDifficulty ? selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1) : "Medium"}
                              </span>

                              <span className="difficulty-arrow">
                                {difficultyOpen ? "▲" : "▼"}
                              </span>
                          </button>

                          {difficultyOpen && (
                              <div className="difficulty-menu">
                                  {difficultyOptions.map((option) => {
                                      const isSelected = selectedDifficulty === option.value;
                                      const isRecommended = currentGame.recommended_difficulty?.toLowerCase() === option.value;

                                      return (
                                          <button key={option.value} className={`difficulty-option ${ isSelected ? "selected" : ""}`}
                                              onClick={() => { setSelectedDifficulty(option.value); setDifficultyOpen(false);
                                              }}
                                          >
                                              <span className="difficulty-option-label">
                                                {option.label}
                                              </span>

                                              {isRecommended && (
                                                  <small>
                                                    Recommended
                                                  </small>
                                              )}
                                          </button>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                      <button className="start-btn" onClick={() => handleStart(currentGame, selectedDifficulty)}>
                        Start Game
                      </button>
                    </div>
                  </div>
              </section>
          )}
        </div>
      </div>
  </div>
  );
}

export default Games;
