import { useEffect, useState } from "react";
import "./LogicShift.css";
import Grid from "./Components/Grid";
import HUD from "./Components/HUD";
import level1 from "./levels/level1";

function LogicShift() {
  const [playerPosition, setPlayerPosition] = useState(level1.playerStart);
  const [hasKey, setHasKey] = useState(false);
  const [grid, setGrid] = useState(level1.grid);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {

  if (timeLeft <= 0) {
    alert("Lejárt az idő!");
    return;
  }

  const timer = setInterval(() => {

    setTimeLeft(prev => prev - 1);

  }, 1000);

  return () => clearInterval(timer);

}, [timeLeft]);
  
  // játékos helyzetének frissítése
  const movePlayer = (dx, dy) => {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    // pályán kívül ne mehessen
    if (
      newY < 0 ||
      newY >= level1.grid.length ||
      newX < 0 ||
      newX >= level1.grid[0].length
    ) {
      return;
    }
    const nextTile = grid[newY][newX];
    // fallon ne mehessen át
    if (nextTile === "wall") {
      return;
    }
    // kulcs felvétele
    if (nextTile === "key") {
      setHasKey(true);
      const updatedGrid = grid.map(row => [...row]);
      updatedGrid[newY][newX] = "empty";
      setGrid(updatedGrid);
      alert("Kulcs megszerezve!");
    }
    // pálya teljesítése
    if (nextTile === "exit" && hasKey) {
      alert("Pálya teljesítve!");
    }
    // lépésszám növelés
    setMoves(prev => prev + 1);
    if (moves + 1 >= level1.maxMoves) {
      alert("Vesztettél!");
    }
    // helyzetfrissítés
    setPlayerPosition({
      x: newX,
      y: newY,
    });
  };

  // lépési opciók
  useEffect(() => {
    const handleKeyDown = (e) => {

      if (e.key === "ArrowUp") {
        movePlayer(0, -1);
      }

      if (e.key === "ArrowDown") {
        movePlayer(0, 1);
      }

      if (e.key === "ArrowLeft") {
        movePlayer(-1, 0);
      }

      if (e.key === "ArrowRight") {
        movePlayer(1, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [playerPosition]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="logicshift-container">
      <div className="logicshift-shell">
      <Grid
        grid={grid}
        playerPosition={playerPosition}
      />
      </div>
      <HUD
        level={1}
        timeLeft={formatTime(timeLeft)}
        totalScore={0}
        moves={moves}
        maxMoves={level1.maxMoves}
        hasKey={hasKey}
      />
    </div>
  );
}

export default LogicShift;