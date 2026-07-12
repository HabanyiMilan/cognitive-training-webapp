import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Trophy, ClockAlert, DoorOpen, RotateCcw, Music } from "lucide-react";
import Confetti from "react-confetti";
import HUD from "./components/HUD";
import Board from "./components/Board";
import { boards } from "./data/boards";
import "@/Games/PowerFlow/PowerFlow.css";
import "@/Games/CardMatch/CardMatch.css";
import { isSolved, updatePowered, getWinningPath } from "./utils/checkConnections";
import { calculateOptimalRotations } from "./utils/calculateOptimalRotations";

const API_BASE = "http://127.0.0.1:5000";

function PowerFlow() {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState("instructions");
    const selectedBoard = boards[Math.floor(Math.random() * boards.length)];
    const initialBoard = structuredClone(selectedBoard.grid);
    const musicRef = useRef(null);
    const victorySoundRef = useRef(null);
    const countSoundRef = useRef(null);
    const startSoundRef = useRef(null);
    const loseSoundRef = useRef(null);
    const turnSoundRef = useRef(null);
    const powerSoundRef = useRef(null);
    const [musicEnabled, setMusicEnabled] = useState(true);
    updatePowered(initialBoard);
    const [board, setBoard] = useState(initialBoard);
    const [optimalRotations, setOptimalRotations] = useState(selectedBoard.optimalRotations);
    const [timeLeft, setTimeLeft] = useState(180);
    const [rotations, setRotations] = useState(0);
    const [score, setScore] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [elapsed, setElapsed] = useState(0);
    const [animationPath, setAnimationPath] = useState([]);
    const [animationIndex, setAnimationIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showFinish, setShowFinish] = useState(false);
    const [finishReason, setFinishReason] = useState("win");
    const gameIdRef = useRef(null);
    const startTimeRef = useRef(null);
    const timeLimitRef = useRef(180);

    const [mistakes, setMistakes] = useState(0);
    const [sessionStatus, setSessionStatus] = useState("idle");

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${String(sec).padStart(2,"0")}`;
    };
    
    const calculateScore = (time, rotations) => {
        const base = 2000;
        const extraRotations = Math.max(0, rotations - optimalRotations);
        return Math.max(0, base - time * 15 - extraRotations * 8);
    };

    useEffect(() => {
        if (gameState !== "playing") return;

        setScore(
            calculateScore(elapsed, rotations)
        );
    }, [elapsed, rotations, gameState]);

      useEffect(() => {
        const fetchGameMeta = async () => {
          try {
            const res = await fetch(`${API_BASE}/games?ability=PROBLEM_SOLVING`);
            if (!res.ok) return;
            const data = await res.json();
            const powerFlow = data.games?.find((game) => game.slug === "power-flow");
            if (powerFlow?.id) gameIdRef.current = powerFlow.id;
            if (powerFlow?.time_limit) {
              const limit = Number(powerFlow.time_limit) || 180;
              timeLimitRef.current = limit;
              setTimeLeft(limit);
            }
          } catch (err) {
            console.error("Failed to fetch game metadata", err);
          }
        };
        fetchGameMeta();
      }, []);

      const recordSession = useCallback(async (finalScore) => {
          if (sessionStatus === "saved" || !gameIdRef.current) return;
          const token = localStorage.getItem("token");
          if (!token) return;
      
          setSessionStatus("saving");
          try {
            const res = await fetch(`${API_BASE}/games/${gameIdRef.current}/sessions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                elapsed,
                mistakes,
                started_at: startTimeRef.current,
                finished_at: new Date().toISOString(),
                estimated_score: finalScore
              }),
            });
      
            if (!res.ok) {
              console.error("Failed to record session", await res.text());
              setSessionStatus("error");
              return;
            }
            setSessionStatus("saved");
          } catch (err) {
            console.error("Failed to record session", err);
            setSessionStatus("error");
          }
        }, [mistakes, sessionStatus]);

    useEffect(() => {
      if (!isAnimating) return;

      if (animationIndex >= animationPath.length - 1) {
          const finalScore = calculateScore(elapsed, rotations);
          recordSession(finalScore);
          setIsAnimating(false);
          setShowFinish(true);
          setGameState("finished");
          if (powerSoundRef.current) {
              powerSoundRef.current.pause();
              powerSoundRef.current.currentTime = 0;
          }
          if (victorySoundRef.current && finishReason === "win") {
              victorySoundRef.current.currentTime = 0;
              victorySoundRef.current.play().catch(() => {});
          }
          else if (loseSoundRef.current && finishReason === "lose") {
              loseSoundRef.current.currentTime = 0;
              loseSoundRef.current.play().catch(() => {});
          }
          return;
      }

      const timer = setTimeout(() => {
          setAnimationIndex(prev => prev + 1);
      }, 180);
      return () => clearTimeout(timer);

    }, [animationIndex, animationPath, isAnimating]);

    const rotateWire = (row, col) => {
        const newBoard = structuredClone(board);
        const cell = newBoard[row][col];
        if (!cell.rotatable) return;
        if (turnSoundRef.current) {
            turnSoundRef.current.currentTime = 0;
            turnSoundRef.current.play().catch(() => {});
        }
        cell.rotation = (cell.rotation + 90) % 360;
        updatePowered(newBoard);

        const solved = isSolved(newBoard);
        setBoard(newBoard);
        const newRotations = rotations + 1;
        const newMistakes = Math.max(0, newRotations - optimalRotations);
        setMistakes(newMistakes);
        setRotations(newRotations);

        if (solved) {
          const path = getWinningPath(newBoard);
          newBoard.forEach(row =>
              row.forEach(cell => {
                  cell.powered = false;
              })
          );
          setFinishReason("win");
          setBoard(newBoard);
          setAnimationPath(path);
          setAnimationIndex(0);
          setIsAnimating(true);
          if (powerSoundRef.current) {
            powerSoundRef.current.currentTime = 0;
            powerSoundRef.current.play().catch(() => {});
          }
          return;
      }
      setBoard(newBoard);
    };

    const resetGame = () => {
        const selectedBoard = boards[Math.floor(Math.random() * boards.length)];
        const randomBoard = structuredClone(selectedBoard.grid);
        updatePowered(randomBoard);
        setBoard(randomBoard);
        setOptimalRotations(selectedBoard.optimalRotations);
        setGameState("instructions");
        setCountdown(3);
        setElapsed(0);
        setTimeLeft(180);
        setScore(2000);
        setRotations(0);
        setShowFinish(false);
        setFinishReason(null);
        setAnimationPath([]);
        setAnimationIndex(-1);
        setIsAnimating(false);
        setMistakes(0);
        setSessionStatus("idle");
        startTimeRef.current = null;
    };

    useEffect(() => {
        if (gameState !== "countdown") return;

        if (countdown > 0) {
          if (countSoundRef.current) {
            countSoundRef.current.currentTime = 0;
            countSoundRef.current.play().catch(() => {});
          }
          const timer = setTimeout(() => {
              setCountdown(prev => prev - 1);
          }, 1000);

          return () => clearTimeout(timer);
        }

        if (countdown === 0) {
          startTimeRef.current = new Date().toISOString();

          if (startSoundRef.current) {
            startSoundRef.current.currentTime = 0;
            startSoundRef.current.play().catch(() => {});
          }
          const timer = setTimeout(() => {
              setGameState("playing");
          }, 800);

          return () => clearTimeout(timer);
        }
    }, [countdown, gameState]);

    useEffect(() => {
        if (gameState !== "playing") return;

        const interval = setInterval(() => {

            setElapsed(prev => prev + 1);

            setTimeLeft(prev => {

                if (prev <= 1) {
                    clearInterval(interval);
                    setFinishReason("lose");
                    if (loseSoundRef.current) {
                        loseSoundRef.current.currentTime = 0;
                        loseSoundRef.current.play().catch(() => {});
                    }
                    recordSession( calculateScore(elapsed, rotations));
                    setShowFinish(true);
                    setGameState("finished");
                    return 0;
                }

                return prev - 1;
            });

        },1000);

        return () => clearInterval(interval);

    }, [gameState]);

    useEffect(() => {
  if (musicRef.current)
    musicRef.current.volume = 0.15;

  if (victorySoundRef.current)
    victorySoundRef.current.volume = 0.5;

  if (countSoundRef.current)
    countSoundRef.current.volume = 0.25;

  if (startSoundRef.current)
    startSoundRef.current.volume = 0.25;

  if (loseSoundRef.current)
    loseSoundRef.current.volume = 0.25;
}, []);

    useEffect(() => {
      if (!musicRef.current) return;

      if (
        musicEnabled &&
        gameState === "playing"
      ) {
        musicRef.current.play().catch(console.error);
      } else {
        musicRef.current.pause();
      }
    }, [musicEnabled, gameState]);


  return (
    <div className="powerflow-page">
      <audio ref={musicRef} src="/assets/audio/chill-music.mp3" loop/>
      <audio ref={victorySoundRef} src="/assets/audio/victory.mp3"/>
      <audio ref={countSoundRef} src="/assets/audio/countdown.mp3"/>
      <audio ref={startSoundRef} src="/assets/audio/start.mp3"/>
      <audio ref={loseSoundRef} src="/assets/audio/lose.mp3"/>
      <audio ref={powerSoundRef} src="/assets/audio/power.mp3"/>
      <audio ref={turnSoundRef} src="/assets/audio/turn.mp3"/>
        {gameState === "instructions" && (
        <div className="overlay">
          <div className="modal">
            <h2>Power Flow</h2>
            <div className="instruction-subtitle">
                Connect the power lines to ensure electricity flows smoothly from the source to the destination. The faster and more efficiently you solve the puzzle, the higher your score will be.
            </div>
            <div className="instruction-stats">
              <div className="instruction-stat">
                <span>03:00</span>
                <small>Time</small>
              </div>
              <div className="instruction-stat">
                <span>2000</span>
                <small>Max Score</small>
              </div>
              <div className="instruction-stat">
                <span>6x6</span>
                <small>Board Size</small>
              </div>
            </div>
            <div className="instructions-rules">
              <div className="rule-item">
                Click on the tiles to rotate them and connect the power lines from the source to the destination.
              </div>
              <div className="rule-item">
                The game is timed, and you have 3 minutes to complete the puzzle. The faster you complete it, the higher your score.
              </div>
            </div>

            <button style={{ marginTop: "1rem" }} className="ghost-btn"
              onClick={() => { setCountdown(3); setGameState("countdown");}}>
              <Play size={20} /> Start Game
            </button>
          </div>
        </div>
      )}
        {gameState === "countdown" && (
        <div className="countdown-overlay">
          <span
            key={countdown}
            className={`countdown-number ${
              countdown === 0 ? "countdown-start" : ""
            }`}>
            {countdown === 0 ? "GO!" : countdown}
          </span>
        </div>
        )}
        {gameState === "paused" && (
        <div className="overlay">
          <div className="modal">
            <h2>Game Paused</h2>
            <div className="pause-actions">
              <button className="ghost-btn" onClick={() => setGameState("playing")}>
                <Play size={20} /> Resume
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                <RotateCcw size={20} /> Restart Game
              </button>
              <button className="ghost-btn" onClick={() => setMusicEnabled(prev => !prev)}>
                <Music size={20} /> {musicEnabled ? "Disable Music" : "Enable Music"}
              </button>
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                <DoorOpen size={20} /> Exit game
              </button>
            </div>
          </div>
        </div>
        )}
        <section className="powerflow-container">
            <HUD score={score} timeLeft={timeLeft} rotations={rotations} onPause={() => setGameState("paused")}/>
            <div className="powerflow-shell">
              <Board board={board} onRotate={rotateWire} animationPath={animationPath} animationIndex={animationIndex} />
            </div>
        </section>

        {showFinish && finishReason === "win" && (
          <Confetti
            recycle={false}
            numberOfPieces={300}
          />
        )}

        {showFinish && (
        <div className="finish-backdrop">
          <div className="finish-modal">
           <div className="finish-icon">
              {finishReason === "win" ? (
                <Trophy size={64} />
              ) : (
                <ClockAlert size={64} />
              )}
            </div>
            <h2 className="finish-title">
              {finishReason === "win" ? "Congratulations, you have found the optimal solution!" : "Time's up! Better luck next time."}
            </h2>
            <div className="finish-score">
              {score}
            </div>
            <div className="finish-score-label">
              POINTS
            </div>
            <div className="finish-stats">
              <div className="finish-stat">
                  <span>{formatTime(elapsed)}</span>
                  <small>Time</small>
              </div>
              <div className="finish-stat">
                  <span>{rotations}</span>
                  <small>Your Rotations</small>
              </div>
              <div className="finish-stat">
                  <span>{optimalRotations}</span>
                  <small>Optimal Rotations</small>
              </div>
          </div>
            <div className="finish-actions">
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                <DoorOpen />Exit game
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                <Play />Play again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PowerFlow;