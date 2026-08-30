import { Menu } from "lucide-react";

const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${String(sec).padStart(2,"0")}`;
    };

function HUD ({ score, timeLeft, rotations, onPause }) {
    return (
        <header className="powerflow-header">
            <button className="pause-menu-btn" onClick={onPause}>
                <Menu size={24} />
            </button>
            <div className="powerflow-stats">
                <div className="stat-chip-card">
                    <span className="stat-label">Time Left</span>
                    <span className="stat-value">{formatTime(timeLeft)}</span>
                </div>
                <div className="stat-chip-card">
                    <span className="stat-label">Rotations</span>
                    <span className="stat-value">{rotations}</span>
                </div>
            </div>
        </header>
    );
}

export default HUD;