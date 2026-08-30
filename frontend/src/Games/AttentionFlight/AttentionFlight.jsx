import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { FORMATIONS, EASY_FORMATIONS } from "./data/formations";
import Confetti from "react-confetti";
import GameBoard from "./components/GameBoard";
import ResultInsights from "../results/ResultInsights.jsx";
import ResultOverview from "../results/ResultOverview.jsx";
import ResultProgress from "../results/ResultProgress.jsx";
import difficultyConfig from "./DifficultyConfig";
import gif3 from "@/assets/images/attention-flight-3.gif";
import TutorialKeyboard from "./components/TutorialKeyboard";
import LoadingScreen from "@/components/LoadingScreen.jsx";

import "@/Games/AttentionFlight/AttentionFlight.css";
import "@/Games/CardMatch/CardMatch.css";
import "@/Games/results/Results.css";

const API_BASE = "http://127.0.0.1:5000";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return `${mins}:${secs}`;
}

function AttentionFlight() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("instructions");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const wrongAnswersRef = useRef(0);
  const [showFinish, setShowFinish] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [gameMeta, setGameMeta] = useState(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const musicRef = useRef(null);
  const timerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const countSoundRef = useRef(null);
  const startSoundRef = useRef(null);
  const victorySoundRef = useRef(null);
  const [planes, setPlanes] = useState([]);
  const [centerDirection, setCenterDirection] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const streakRef = useRef(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [sessionStatus, setSessionStatus] = useState("idle");
  const sessionSavedRef = useRef(false);
  const startTimeRef = useRef(null);
  const gameIdRef = useRef(null);
  const timeLimitRef = useRef(60);
  const elapsed = timeLimitRef.current - timeLeft;
  const [resultData, setResultData] = useState(null);
  const [resultStep, setResultStep] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const resultPages = ["overview", "progress", "insights"];
  const DIRECTIONS = ["up", "down", "left", "right"];
  const selectedDifficulty = searchParams.get("difficulty") || gameMeta?.recommended_difficulty?.toLowerCase() || "medium";
  const config = difficultyConfig[selectedDifficulty] || difficultyConfig.medium;

  useEffect(() => {
      const loadingStart = Date.now();
      const fetchGameMeta = async () => {
        try {
          const token = localStorage.getItem("token");

          const res = await fetch(`${API_BASE}/games?ability=ATTENTION`, {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          });
          if (!res.ok) return;
          const data = await res.json();
          const attentionFlight = data.games?.find((game) => game.slug === "attention-flight");
          if (attentionFlight) {
            setGameMeta(attentionFlight);
          }
          if (attentionFlight?.id) gameIdRef.current = attentionFlight.id;
          if (attentionFlight?.time_limit) {
            const limit = Number(attentionFlight.time_limit) || 60;
            timeLimitRef.current = limit;
            setTimeLeft(limit);
          }
        } catch (err) {
          console.error("Failed to fetch game metadata", err);
        } finally {
          const elapsed = Date.now() - loadingStart;
          const remaining = Math.max(0, 3000 - elapsed);

          setTimeout(() => {
            setIsLoading(false);
          }, remaining);
      }
      };
      fetchGameMeta();
    }, []);

function showFeedback(type, points = 0) {
  const id = Date.now() + Math.random();

  setFeedbacks(prev => [
    ...prev,
    {
      id,
      type,
      points
    }
  ]);

  setTimeout(() => {
    setFeedbacks(prev =>
      prev.filter(item => item.id !== id)
    );
  }, 500);
}

function generateRound() {
  const availableFormations = config.formations === "simple" ? EASY_FORMATIONS : FORMATIONS;
  const formation = availableFormations[Math.floor( Math.random() * availableFormations.length)];

  const centerX = 450 + Math.random() * 400;
  const centerY = 250 + Math.random() * 150;

  const newPlanes = formation.map((position) => ({
      id: crypto.randomUUID(),

      x: centerX + position.x,
      y: centerY + position.y,

      direction:
        DIRECTIONS[
          Math.floor(
            Math.random() *
            DIRECTIONS.length
          )
        ],

      isTarget: false
    })
    );

    const targetIndex = Math.floor(Math.random()*newPlanes.length);
    newPlanes[targetIndex].isTarget = true;
    const targetPlane = newPlanes[targetIndex];

    setCenterDirection(targetPlane.direction);
    setPlanes(newPlanes);
    console.log("Target:", targetPlane.direction);
    console.log(newPlanes);
  }

  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;

        if (next <= 0) {
          finishGame();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [gameState]);
  

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

    generateRound();

    const timer = setTimeout(() => {
      startTimeRef.current = new Date().toISOString();
      setGameState("playing");
      startResponseTimer();
    }, 800);

    return () => clearTimeout(timer);
  }
}, [countdown, gameState]);

function nextRound() {
  generateRound();
  startResponseTimer();
}

function startResponseTimer() {
  if (responseTimerRef.current) {
    clearTimeout(responseTimerRef.current);
    responseTimerRef.current = null;
  }

  if (config.responseTime === null  || gameState !== "playing") {
    return;
  }

  responseTimerRef.current = setTimeout(() => {
    if (gameState !== "playing") {
      return;
    }
    handleTimeout();
  }, config.responseTime);
}

function finishGame() {
  if (responseTimerRef.current) {
    clearTimeout(responseTimerRef.current);
    responseTimerRef.current = null;
  }

  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  setGameState("finished");
  setShowFinish(true);

  if (victorySoundRef.current) {
    victorySoundRef.current.currentTime = 0;
    victorySoundRef.current.play().catch(() => {});
  }
}

function handleTimeout() {
  if (gameState !== "playing") {
    return;
  }
  showFeedback("wrong", Math.abs(config.scoreWrong));
  registerMistake();
  streakRef.current = 0;
  setCurrentStreak(0);
  setScore(prev => Math.max(0, prev - config.scoreWrong));
  nextRound();
}

const recordSession = useCallback(async (finalScore, finalElapsed) => {
    if ( sessionSavedRef.current || !gameIdRef.current) { return; }
    const token = localStorage.getItem("token");
    if (!token) return;
    console.log("Saving session:", {score: finalScore, elapsed: finalElapsed, mistakes: wrongAnswersRef.current});
    sessionSavedRef.current = true;
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
          mistakes: wrongAnswersRef.current,
          started_at: startTimeRef.current,
          finished_at: new Date().toISOString(),
          estimated_score: finalScore
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to record session", await res.text());
        sessionSavedRef.current = false;
        setSessionStatus("error");
        return;
      }
      console.log("Session saved:", data);
      setResultData(data.result);
      setResultStep(0);
      setSessionStatus("saved");
    } catch (err) {
      console.error("Failed to record session", err);
      sessionSavedRef.current = false;
      setSessionStatus("error");
    }
  }, []);

  const resetGame = () => {
    sessionSavedRef.current = false;
    wrongAnswersRef.current = 0;
    setSessionStatus("idle");
    setResultData(null);
    setGameState("instructions");
    setCountdown(3);
    setTimeLeft(config.time);
    setScore(0);
    setTutorialStep(0);
    setCurrentStreak(0);
    setWrongAnswers(0);
    setShowFinish(false);
    setPlanes([]);
    setCenterDirection(null);
    streakRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (responseTimerRef.current){
      clearTimeout(responseTimerRef.current)
    }
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  };

  const tutorial = [
    {
      text: "Match the airplane's direction with the correct arrow key.",
      type: "correct"
    },
    {
      text: "Pressing the wrong key will hurt your score. Stay focused and react quickly!",
      type: "wrong"
    },
    {
      text: "Multiple planes will appear. Focus only on the highlighted plane and identify its direction.",
      type: "gif",
      image: gif3
    }
    ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && gameState === "playing") {
        setGameState("paused");
        return;
      }

      if (e.key === "Escape" && gameState === "paused") {
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
          responseTimerRef.current = null;
        }

        setGameState("paused");
        return;
      }

      if (gameState !== "playing")
        return;

      let answer = null;

      if (e.key === "ArrowUp")
        answer = "up";
      if (e.key === "ArrowDown")
        answer = "down";
      if (e.key === "ArrowLeft")
        answer = "left";
      if (e.key === "ArrowRight")
        answer = "right";

      if (!answer) return;
      if (answer === centerDirection) {
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
        }
        if (correctSoundRef.current) {
            correctSoundRef.current.currentTime = 0;
            correctSoundRef.current.play().catch(() => {});
          }
        streakRef.current++;
        const nextStreak = streakRef.current;
        setCurrentStreak(nextStreak);
        const streakPoints = Math.min(nextStreak * config.scoreCorrect, config.scoreCorrect*5);
        showFeedback("correct", streakPoints);
        setScore(prev => {
          const nextScore = Math.min(prev + streakPoints, 2000);
          if (nextScore >= 2000) {
            setShowFinish(true);
            setGameState("finished");
          }
          return nextScore;
        });
      } else {
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
        }
        if (wrongSoundRef.current) {
            wrongSoundRef.current.currentTime = 0;
            wrongSoundRef.current.play().catch(() => {});
          }
        showFeedback("wrong", Math.abs(config.scoreWrong));
        registerMistake();
        streakRef.current = 0;
        setCurrentStreak(0);
        setScore(
          prev =>
            Math.max(0, prev - config.scoreWrong)
        );
      }
      nextRound();
    };
    window.addEventListener(
      "keydown",
      handleKeyDown
    );
    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [gameState, centerDirection]);

  useEffect(() => {
  if (gameState !== "playing") {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }
}, [gameState]);

  useEffect(() => {
    if (score < 2000) return;
    setScore(2000);
    finishGame();
  }, [score]);

  function registerMistake() {
    wrongAnswersRef.current += 1;
    setWrongAnswers(wrongAnswersRef.current);
  }

  useEffect(() => {
    if (gameState !== "finished") return;
    const finalElapsed = timeLimitRef.current - timeLeft;
    recordSession(score, finalElapsed);

  }, [gameState]);

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

  useEffect(() => {
  if (musicRef.current)
    musicRef.current.volume = 0.15;
  
  if (correctSoundRef.current)
    correctSoundRef.current.volume = 0.5;

  if (wrongSoundRef.current)
    wrongSoundRef.current.volume = 0.5;

  if (countSoundRef.current)
    countSoundRef.current.volume = 0.25;

  if (startSoundRef.current)
    startSoundRef.current.volume = 0.25;

}, []);

if (isLoading) {
      return (
          <LoadingScreen game="attention-flight" text="Searching for planes in the system..." />
      );
  }

  return (
    <div className="attentionflight-page">
      <audio ref={correctSoundRef} src="/assets/audio/correct.mp3"/>
      <audio ref={wrongSoundRef} src="/assets/audio/wrong.mp3"/>
      <audio ref={countSoundRef} src="/assets/audio/countdown.mp3"/>
      <audio ref={startSoundRef} src="/assets/audio/start.mp3"/>
      <audio ref={musicRef} src="/assets/audio/chill-music2.mp3" loop/>
      <audio ref={victorySoundRef} src="/assets/audio/victory.mp3"/>

      {gameState === "instructions" && (
        <div className="overlay">
        <div className="modal">
          <h2>How To Play</h2>
          {tutorial[tutorialStep].type === "gif" ? (
            <img src={tutorial[tutorialStep].image} className="tutorial-image"/>) : 
            (<TutorialKeyboard mode={tutorial[tutorialStep].type}/>)}
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
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="attentionflight-container">
        <header className="attentionflight-header">
        <button className="pause-menu-btn" onClick={() => {
            if (responseTimerRef.current) {
              clearTimeout(responseTimerRef.current);
              responseTimerRef.current = null;
            }
            setGameState("paused");
          }}>
            <Menu size={24} />
          </button>
          <div className="cardmatch-stats">
            <div className="stat-chip-card">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-chip-card">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{currentStreak}</span>
            </div>
            <div className="stat-chip-card">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>
        <div className="attentionflight-shell">
          <GameBoard planes={planes} />
          {feedbacks.map(item => (
            <div key={item.id} className={`feedback-float ${
                item.type === "correct" ? "feedback-correct" : "feedback-wrong"
              }`}>
              {item.type === "correct" ? `✓ +${item.points}` : `✕ -${item.points}`}
            </div>
          ))}
        </div>
      </section>

      {showFinish && (
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

export default AttentionFlight;