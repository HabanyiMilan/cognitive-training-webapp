import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, RotateCcw, Trophy, Menu, Play, Music, ClockAlert } from "lucide-react";
import Confetti from "react-confetti";
import "@/Games/CardMatch/CardMatch.css";

const API_BASE = "http://127.0.0.1:5000";

const IMAGE_FACES = Object.entries(
  import.meta.glob("@/Games/CardMatch/Images/*.{png,jpg,jpeg,webp,gif}", { eager: true })
).map(([path, mod]) => {
  const filename = path.split("/").pop() || "";
  const label = filename.replace(/\.[^.]+$/, "");
  return {
    image: mod.default ?? mod,
    label,
  };
});

const PAIR_COUNT = 12;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCardFaces() {
  if (IMAGE_FACES.length < PAIR_COUNT) {
    console.error(`Need at least ${PAIR_COUNT} images in Games/CardMatch/Images`);
  }
  return IMAGE_FACES.slice(0, PAIR_COUNT);
}

function createDeck() {
  const faces = getCardFaces();
  const doubled = faces.flatMap((face, idx) => {
    const baseId = `${face.label}-${idx}`;
    const matchKey = face.image ?? face.label;
    return ["a", "b"].map((suffix) => ({
      id: `${baseId}-${suffix}`,
      value: matchKey,
      display: face.label,
      image: face.image,
      label: face.label,
      flipped: false,
      matched: false,
    }));
  });
  return shuffle(doubled);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function CardMatch() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(() => createDeck());
  const [firstCard, setFirstCard] = useState(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [matches, setMatches] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [showFinish, setShowFinish] = useState(false);
  const [gameMeta, setGameMeta] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [gameState, setGameState] = useState("instructions");
  const [floatingScores, setFloatingScores] = useState([]);
  const [finishReason, setFinishReason] = useState(null); // "completed" or "timeout"
  const [musicEnabled, setMusicEnabled] = useState(true);
  const countSoundRef = useRef(null);
  const startSoundRef = useRef(null);
  const musicRef = useRef(null);
  const flipSoundRef = useRef(null);
  const matchSoundRef = useRef(null);
  const victorySoundRef = useRef(null);
  const loseSoundRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [moves, setMoves] = useState(0);

  const startTimeRef = useRef(new Date().toISOString());
  const finishedRef = useRef(false);
  const timerRef = useRef(null);
  const gameIdRef = useRef(null);
  const timeLimitRef = useRef(300);

  useEffect(() => {
  if (gameState !== "playing") return;

  timerRef.current = setInterval(() => {
    setElapsed((prev) => prev + 1);

    setTimeLeft((prev) => {
      const next = Math.max(0, prev - 1);

      if (next === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      return next;
    });
  }, 1000);

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
}, [gameState]);

  useEffect(() => {
    const fetchGameMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/games?ability=MEMORY`);
        if (!res.ok) return;
        const data = await res.json();
        const cardMatch = data.games?.find((game) => game.slug === "card-match");
        if (cardMatch) {
          setGameMeta(cardMatch);
        }
        if (cardMatch?.id) gameIdRef.current = cardMatch.id;
        if (cardMatch?.time_limit) {
          const limit = Number(cardMatch.time_limit) || 300;
          timeLimitRef.current = limit;
          setTimeLeft(limit);
        }
      } catch (err) {
        console.error("Failed to fetch game metadata", err);
      }
    };
    fetchGameMeta();
  }, []);

  const resetGame = () => {
    setCards(createDeck());
    setGameState("instructions");
    setFinishReason(null);
    setCountdown(3);
    setFirstCard(null);
    setLockBoard(false);
    setMatches(0);
    setMistakes(0);
    setElapsed(0);
    setMoves(0);
    setTimeLeft(timeLimitRef.current);
    setShowFinish(false);
    setSessionStatus("idle");
    finishedRef.current = false;
    startTimeRef.current = new Date().toISOString();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && gameState === "playing") {
        setGameState("paused");
        return;
      }

      if (e.key === "Escape" && gameState === "paused") {
        setGameState("playing");
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState]);

  useEffect(() => {
  if (matches === PAIR_COUNT && !finishedRef.current) {
    finishedRef.current = true;
    finalScoreRef.current = estimatedScore;

    setFinishReason("win");
    setShowFinish(true);
    setGameState("finished");

    if (musicRef.current) { musicRef.current.pause();}

    if (victorySoundRef.current) {victorySoundRef.current.currentTime = 0; victorySoundRef.current.play().catch(() => {});}

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    recordSession(finalScoreRef.current);
  }
}, [matches, recordSession]);

useEffect(() => {
  if (timeLeft === 0 && !finishedRef.current) {
    finishedRef.current = true;
    finalScoreRef.current = estimatedScore;

    setFinishReason("timeout");
    setShowFinish(true);
    setGameState("finished");

    if (musicRef.current) { musicRef.current.pause();}

    if (loseSoundRef.current) {loseSoundRef.current.currentTime = 0; loseSoundRef.current.play().catch(() => {});}

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    recordSession(finalScoreRef.current);
  }
}, [timeLeft, recordSession]);

  const maxScore = gameMeta?.max_score || 2000;
  const timeLimit = gameMeta?.time_limit || timeLimitRef.current;
  const timeFactor = Math.max(0, 1 - elapsed / timeLimit);
  const mistakeFactor = Math.max(0, 1 - mistakes / 30);

  const estimatedScore = Math.floor(
    maxScore * (0.6 * timeFactor + 0.4 * mistakeFactor)
  );

  const finalScoreRef = useRef(null);
  useEffect(() => {
    if (showFinish && finalScoreRef.current === null) {
      finalScoreRef.current = estimatedScore;
    }
  }, [showFinish, estimatedScore]);

  const displayScore = showFinish ? finalScoreRef.current : estimatedScore;
    
  const handleCardClick = (card) => {
    if (gameState !== "playing" || lockBoard || card.matched || card.flipped) return;
    if (flipSoundRef.current) {flipSoundRef.current.currentTime = 0;flipSoundRef.current.play().catch(() => {});}

    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)));

    if (!firstCard) {
      setFirstCard(card);
      return;
    }

    setLockBoard(true);
    setMoves(prev => prev + 1);
    const isMatch = firstCard.value === card.value;

    if (isMatch) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id || c.id === firstCard.id
            ? { ...c, matched: true, flipped: true }
            : c
        )
      );
      if (matchSoundRef.current) {matchSoundRef.current.currentTime = 0; matchSoundRef.current.play().catch(() => {});}
      setMatches((prev) => prev + 1);
      setFirstCard(null);
      setLockBoard(false);

      const id = Date.now();
      setFloatingScores(prev => [
        ...prev,
        {
          id,
          cardId: card.id,
          points: 50
        }
      ]);

      setTimeout(() => {
        setFloatingScores(prev =>
          prev.filter(score => score.id !== id)
        );
      }, 1000);
    } else {
      setMistakes((prev) => prev + 1);
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id || c.id === firstCard.id ? { ...c, flipped: false } : c
          )
        );
        setFirstCard(null);
        setLockBoard(false);
      }, 700);
    }
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
  if (musicRef.current)
    musicRef.current.volume = 0.15;
  
  if (flipSoundRef.current)
    flipSoundRef.current.volume = 0.25;

  if (matchSoundRef.current)
    matchSoundRef.current.volume = 0.35;

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
    <div className="cardmatch-page">
      <audio ref={musicRef} src="/assets/audio/chill-music.mp3" loop/>
      <audio ref={flipSoundRef}src="/assets/audio/flip.mp3"/>
      <audio ref={matchSoundRef} src="/assets/audio/correct.mp3"/>
      <audio ref={victorySoundRef} src="/assets/audio/victory.mp3"/>
      <audio ref={countSoundRef} src="/assets/audio/countdown.mp3"/>
      <audio ref={startSoundRef} src="/assets/audio/start.mp3"/>
      <audio ref={loseSoundRef} src="/assets/audio/lose.mp3"/>
      {gameState === "instructions" && (
        <div className="overlay">
          <div className="modal">
            <h2>Card Match</h2>
            <div className="instruction-subtitle">
              Test your memory and find all matching pairs.
            </div>
            <div className="instruction-stats">
              <div className="instruction-stat">
                <span>12</span>
                <small>Pairs</small>
              </div>

              <div className="instruction-stat">
                <span>04:00</span>
                <small>Time</small>
              </div>

              <div className="instruction-stat">
                <span>2000</span>
                <small>Max Score</small>
              </div>
            </div>
            <div className="instructions-rules">
              <div className="rule-item">
                Remember the position of the cards and find all matching pairs before time runs out.
              </div>
              <div className="rule-item">
                Each mistake reduces your score so take your time and think carefully.
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

      <section className="cardmatch-container">
        <header className="cardmatch-header">
          <button className="menu-btn" onClick={() => setGameState("paused")}>
            <Menu size={24} />
          </button>
          <div className="cardmatch-stats">
            <div className="stat-chip">
              <span className="stat-label">Pairs found:</span>
              <span className="stat-value">
                {matches}/{PAIR_COUNT}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Score</span>
              <span className="stat-value">{displayScore}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Attempts</span>
              <span className="stat-value">{moves}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        <div className="cardmatch-shell">
          <div className="cardmatch-board two-rows">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`card-tile ${card.flipped || card.matched ? "revealed" : ""}`}
                onClick={() => handleCardClick(card)}
                disabled={lockBoard}
              >
                <span className="card-face" style={{ backgroundColor: "#0b1120" }}>
                  {card.flipped || card.matched ? (
                    card.image ? (
                      <>
                        <img src={card.image} alt={card.label} className="card-face-img" />
                      </>
                    ) : (
                      card.display
                    )
                  ) : (
                    ""
                  )}
                </span>
                <span className="card-back" />
                {floatingScores.some(
                  score => score.cardId === card.id
                ) && (
                  <div className="floating-score">
                    Pair Found!
                  </div>
                )}
              </button>
            ))}
          </div>
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
              {finishReason === "win" ? "Congratulations, you have found all pairs successfully!" : "Time's up! Better luck next time."}
            </h2>
            <div className="finish-score">
              {displayScore}
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
                <span>{mistakes}</span>
                <small>Mistakes</small>
              </div>
              <div className="finish-stat">
                {moves > 0 ? (
                  <span>{Math.round((matches / moves) * 100)}%</span>
                ) : (
                  <span>0%</span>
                )}
                <small>Accuracy</small>
              </div>
            </div>
            {sessionStatus === "error" && (
              <p className="error-note">
                We could not save your session. Try again or play another round.
              </p>
            )}
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

export default CardMatch;
