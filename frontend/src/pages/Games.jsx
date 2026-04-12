import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "@/components/Toast.jsx";
import { PlayIcon, TimerIcon, Brain, Eye, Handshake } from "lucide-react";
import "../styles/Games.css";
import "../styles/Index.css";

function Games() {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState("Memory");
  const [toast, setToast] = useState("");
  const [games, setGames] = useState([]);
  const handleStart = (game) => {
    if (game?.slug === "card-match") {
      navigate("/games/card-match");
      return;
    }
    setToast(`${game?.name ?? "Game"} launcher coming soon.`);
  };
  const abilityMap = {
    "Memory": "MEMORY",
    "Attention": "ATTENTION",
    "Problem Solving": "PROBLEM_SOLVING"
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/games?ability=${abilityMap[activeTag]}`);
        const data = await res.json();
        setGames(data?.games ?? []);
      } catch (err) {
        console.error("Failed to load games", err);
        setGames([]);
      }
    };
    fetchGames();
  }, [activeTag, "http://127.0.0.1:5000"]);

  return (
    <div className="games-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="games-header-container">
        <section className="games-header">
          <h1>Games</h1>
          <p className="subtitle">
            Train your cognitive skills with our fun and engaging games. Choose a category below to get started!
          </p>
          <div className="games-tabs">
            {Object.keys(abilityMap).map((tag) => (
              <button key={tag} className={`games-tab ${activeTag === tag ? "active" : ""}`} onClick={() => setActiveTag(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="game-grid">
        {games.map((game) => {
          const abilityLabel = game.ability_type?.toLowerCase() === "memory" ? "Memory Boost"
          : game.ability_type?.toLowerCase() === "problem_solving" ? "Problem Solving Boost"
          : game.ability_type ? `${game.ability_type.charAt(0).toUpperCase()}${game.ability_type.slice(1)} Boost`
          : "Boost";
          const gamePillIcon = game.ability_type === "memory" ? <Brain size={24} /> : game.ability_type === "problem_solving" ? <Handshake size={24} /> : <Eye size={24} />;
          const timeSeconds = Number(game.time_limit);
          const timeDisplay = Number.isFinite(timeSeconds) ? `${Math.max(1, Math.round(timeSeconds / 60))} min` : game.time_limit;

          return (
            <article className="game-card" key={game.id || game.slug}>
              <div className="game-card__body">
                <h2 className="game-title">{game.name}</h2>
                <div className="game-image">
                  <img src={game?.icon_path ? `/src/assets/images/${game.icon_path}`  : "/src/assets/images/Home.png"} alt={game?.name}/>
                </div>
                <p className="game-desc">{game.description}</p>
                <div className="game-meta">
                  <div className="game-pill">
                    {gamePillIcon}
                    <span>{abilityLabel}</span>
                  </div>
                  <span className="meta">
                    <TimerIcon size={16} />
                    {timeDisplay}
                  </span>
                </div>
                <div className="game-card__actions">
                  <button className="start-btn" onClick={() => handleStart(game)}>
                    <PlayIcon size={18} />
                    Start Game
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default Games;
