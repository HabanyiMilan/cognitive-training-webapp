import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "@/components/Toast.jsx";
import { PlayIcon, Sparkles, TimerIcon } from "lucide-react";
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
  const tags = ["Memory", "Attention", "Problem Solving"];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/games?ability=${activeTag.toUpperCase()}`);
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

      <section className="games-header">
        <h1>Games</h1>
        <p className="subtitle">
          Sharpen your memory with focused, science-inspired exercises.
        </p>
        <div className="games-tabs">
          {tags.map((tag) => (
            <button key={tag} className={`games-tab ${activeTag === tag ? "active" : ""}`} onClick={() => setActiveTag(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="game-grid">
        {games.map((game) => {
          const abilityLabel =
            game.ability_type?.toLowerCase() === "memory" ? "Memory Boost"
              : game.ability_type ? `${game.ability_type.charAt(0).toUpperCase()}${game.ability_type.slice(1)} Focus` : "Focus";

          const showEasyBadge = game.difficulty && game.difficulty.toLowerCase() === "easy";
          const timeSeconds = Number(game.time_limit);
          const timeDisplay = Number.isFinite(timeSeconds) ? `${Math.max(1, Math.round(timeSeconds / 60))} min` : game.time_limit;
          const iconSrc = game.icon_path?.startsWith("/") ? game.icon_path : `/assets/icons/${game.icon_path || "placeholder.svg"}`;

          return (
            <article className="game-card" key={game.id || game.slug}>
              <div className="game-card__glow" aria-hidden="true" />
              <div className="game-card__body">
                <div className="game-card__meta">
                  <div className="game-icon">
                    <img src={iconSrc} alt={`${game.name} icon`} />
                  </div>
                  <div className="game-card__text">
                    <div className="game-pill">
                      <Sparkles size={16} />
                      <span>{abilityLabel}</span>
                    </div>
                    <h3 className="game-title">{game.name}</h3>
                    <p className="game-desc">{game.description}</p>
                    <div className="game-info">
                      {showEasyBadge && <span className="badge easy">Easy</span>}
                      <span className="meta">
                        <TimerIcon size={16} />
                        {timeDisplay}
                      </span>
                    </div>
                  </div>
                  <div className="game-card__actions">
                    <button className="start-btn" onClick={() => handleStart(game)}>
                      <PlayIcon size={18} />
                      Start Game
                    </button>
                  </div>
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
