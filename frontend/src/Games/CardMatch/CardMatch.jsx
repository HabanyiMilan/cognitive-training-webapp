import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Confetti from "react-confetti";
import "@/Games/CardMatch/CardMatch.css";
import "@/Games/results/Results.css";
import gif1 from "../CardMatch/howToPlayImages/card-match-1.gif";
import gif2 from "../CardMatch/howToPlayImages/card-match-2.gif";
import gif3 from "../CardMatch/howToPlayImages/card-match-3.gif";
import difficultyConfig from "./DifficultyConfig";
import ResultInsights from "../results/ResultInsights.jsx";
import ResultOverview from "../results/ResultOverview.jsx";
import ResultProgress from "../results/ResultProgress.jsx";

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

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCardFaces(pairCount) {
  if (IMAGE_FACES.length < pairCount) {
    console.error(`Need at least ${pairCount} images in Games/CardMatch/Images`);
  }
  return IMAGE_FACES.slice(0, pairCount);
}

function createDeck(pairCount) {
  const faces = getCardFaces(pairCount);
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
  const [cards, setCards] = useState([]);
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
  const [tutorialStep, setTutorialStep] = useState(0);
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
  const [resultData, setResultData] = useState(null);
  const [resultStep, setResultStep] = useState(0);

  const startTimeRef = useRef(new Date().toISOString());
  const finishedRef = useRef(false);
  const timerRef = useRef(null);
  const gameIdRef = useRef(null);
  const timeLimitRef = useRef(180);

  const config = difficultyConfig[gameMeta?.recommended_difficulty ?? "medium"];
  const resultPages = ["overview", "progress", "insights"];

  useEffect(() => {
    if (!gameMeta) return;

    setCards(createDeck(config.pairs));

    setTimeLeft(config.time);
    timeLimitRef.current = config.time;
  }, [gameMeta]);

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
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/games?ability=MEMORY`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) return;
        const data = await res.json();
        const cardMatch = data.games?.find((game) => game.slug === "card-match");
        if (cardMatch) {
          setGameMeta(cardMatch);
        }
        if (cardMatch?.id) gameIdRef.current = cardMatch.id;
        if (config.time) {
          setTimeLeft(config.time);
          timeLimitRef.current = config.time;
        }
      } catch (err) {
        console.error("Failed to fetch game metadata", err);
      }
    };
    fetchGameMeta();
  }, []);

  const resetGame = () => {
    setCards(createDeck(config.pairs));
    setGameState("instructions");
    setFinishReason(null);
    setCountdown(3);
    setFirstCard(null);
    setLockBoard(false);
    setTutorialStep(0);
    setMatches(0);
    setMistakes(0);
    setElapsed(0);
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

  const tutorial = [
  {
      text: "Click on the cards to flip them. Your task will be to find the pair of each card.",
      image: gif1
  },
  {
      text: "Every incorrect attempts lowers your final score. Try to finish with less attempts for higher result.",
      image: gif2
  },
  {
      text: "The game will end once you find all pairs or if time runs out.",
      image: gif3
  }
  ];

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

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to record session", await res.text());
        setSessionStatus("error");
        return;
      }
      setResultData(data.result);
      setResultStep(0);
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
  if (matches === config.pairs && !finishedRef.current) {
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
  const timeLimit = config.time || timeLimitRef.current;
  const timeFactor = Math.max(0, 1 - elapsed / timeLimit);
  const mistakeFactor = Math.max(0, 1 - mistakes / 30);

  const estimatedScore = Math.floor(maxScore * (0.6 * timeFactor + 0.4 * mistakeFactor));

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
          <h2>How To Play</h2>
          <img src={tutorial[tutorialStep].image} className="tutorial-image"/>
          <p className="instruction-subtitle">
            {tutorial[tutorialStep].text}
          </p>

          <div className="tutorial-progress">
            {tutorial.map((_, index) => (<span key={index} className={ index === tutorialStep ? "active-dot" : ""}/>))}
          </div>

          <div className="tutorial-buttons">
              {tutorialStep > 0 && (
                  <button className="back" onClick={() => setTutorialStep(prev => prev - 1)}>
                    Back
                  </button>
              )}

              {tutorialStep < tutorial.length - 1 ? (
                  <button className="next" onClick={() => setTutorialStep(prev => prev + 1)}>
                    Next
                  </button>
              ) : (
                  <button className="understand" onClick={() => {setCountdown(3); setGameState("countdown")}}>
                    I Understand & Start Game
                  </button>
              )}
          </div>
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
          <div className="pause-modal">
            <h2>Game Paused</h2>
            <div className="pause-actions">
              <button className="ghost-btn" onClick={() => setGameState("playing")}>
                Resume
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                Restart Game
              </button>
              <button className="ghost-btn" onClick={() => setMusicEnabled(prev => !prev)}>
                {musicEnabled ? "Disable Music" : "Enable Music"}
              </button>
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                Exit game
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="cardmatch-container">
        <header className="cardmatch-header">
          <button className="pause-menu-btn" onClick={() => setGameState("paused")}>
            <Menu size={24} />
          </button>
          <div className="cardmatch-stats">
            <div className="stat-chip-card">
              <span className="stat-label">Pairs found</span>
              <span className="stat-value">
                {matches}/{config.pairs}
              </span>
            </div>
            <div className="stat-chip-card">
              <span className="stat-label">Score</span>
              <span className="stat-value">{displayScore}</span>
            </div>
            <div className="stat-chip-card">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        <div className="cardmatch-shell">
          <div className="cardmatch-board" style={{
                "--columns": config.columns
            }}>
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

      {showFinish && resultData && (
        <div className="result-overlay">
          <div className="result-modal">
            <div className="result-content">
              {resultStep === 0 && (
                <ResultOverview result={resultData} />
              )}
              {resultStep === 1 && (
                <ResultProgress result={resultData} />
              )}
              {resultStep === 2 && (
                <ResultInsights result={resultData} />
              )}
            </div>
            <div className="result-progress">
              {resultPages.map((_, index) => (
                <span key={index} className={index === resultStep ? "active-dot" : ""}/>
              ))}
            </div>
            <div className="result-buttons">
              {resultStep > 0 && (
                <button className="result-back" onClick={() => setResultStep(prev => prev - 1)}>
                  Back
                </button>
              )}
              {resultStep < resultPages.length - 1 ? (
                <button className="result-next" onClick={() => setResultStep(prev => prev + 1)}>
                  Next
                </button>
              ) : (
                <div className="result-final-actions">
                  <button className="result-primary" onClick={resetGame}>
                    Play Again
                  </button>
                  
                  <button className="result-secondary" onClick={() => navigate("/games")}>
                    Exit Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardMatch;
