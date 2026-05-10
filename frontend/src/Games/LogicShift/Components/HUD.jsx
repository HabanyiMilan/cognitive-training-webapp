import { Key, Footprints, Star, Clock } from "lucide-react";
function HUD({ level, timeLeft, totalScore, moves, maxMoves, hasKey }) {
  return (
    <div className="hud">
      <div className="hud-section">
        <h2 className="hud-title">
          Level {level}
        </h2>

        <div className="hud-item">
          <Clock size={20} />
          <span>Idő: {timeLeft}s</span>
        </div>

        <div className="hud-item">
          <Star size={20} />
          <span>Pontszám: {totalScore}</span>
        </div>

      </div>

      <div className="hud-divider"></div>

      <div className="hud-section">

        <h3 className="hud-subtitle">
          Aktuális pálya
        </h3>

        <div className="hud-item">
          <Key size={20} />
          <span>
            Kulcs: {hasKey ? "1/1" : "0/1"}
          </span>
        </div>

        <div className="hud-item">
          <Footprints size={20} />
          <span>
            Lépések: {moves} / {maxMoves}
          </span>
        </div>

      </div>

    </div>
  );
}

export default HUD;