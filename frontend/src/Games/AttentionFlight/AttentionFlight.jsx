import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, RotateCcw, Trophy, Menu, Play, Music } from "lucide-react";
import { FORMATIONS } from "./data/formations";
import Confetti from "react-confetti";
import GameBoard from "./components/GameBoard";

import "@/Games/AttentionFlight/AttentionFlight.css";
import "@/Games/CardMatch/CardMatch.css";

const API_BASE = "http://127.0.0.1:5000";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const secs = (seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

function AttentionFlight() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("instructions");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [showFinish, setShowFinish] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [gameMeta, setGameMeta] = useState(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const musicRef = useRef(null);
  const timerRef = useRef(null);
  const countSoundRef = useRef(null);
  const startSoundRef = useRef(null);
  const victorySoundRef = useRef(null);
  const [planes, setPlanes] = useState([]);
  const [centerDirection, setCenterDirection] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const streakRef = useRef(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [sessionStatus, setSessionStatus] = useState("idle");
  const sessionSavedRef = useRef(false);
  const startTimeRef = useRef(null);
  const gameIdRef = useRef(null);
  const timeLimitRef = useRef(60);
  const elapsed = timeLimitRef.current - timeLeft;

  const DIRECTIONS = [
    "up",
    "down",
    "left",
    "right"
  ];

  useEffect(() => {
      const fetchGameMeta = async () => {
        try {
          const res = await fetch(`${API_BASE}/games?ability=ATTENTION`);
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

  const formation =
    FORMATIONS[
      Math.floor(
        Math.random() * FORMATIONS.length
      )
    ];

  const centerX = 450 + Math.random() * 400;
  const centerY = 250 + Math.random() * 150;

  const newPlanes = formation.map(
    (position, index) => ({
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

      isCenter: index === 0
    })
    );

    const centerPlane = newPlanes.find(p => p.isCenter);

    setCenterDirection(
      centerPlane.direction
    );

    setPlanes(newPlanes);
    console.log("CENTER:", centerPlane.direction);
    console.log(newPlanes);
  }

  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;

        if (next <= 0) {
          clearInterval(timerRef.current);
          setGameState("finished");
          setShowFinish(true);
          if (victorySoundRef.current) {victorySoundRef.current.currentTime = 0; victorySoundRef.current.play().catch(() => {});}
          recordSession(score);
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
      setGameState("playing");
    }, 800);

    return () => clearTimeout(timer);
  }
}, [countdown, gameState]);

const recordSession = useCallback(async (finalScore) => {
    if ( sessionSavedRef.current || !gameIdRef.current) { return; }
    sessionSavedRef.current = true;
    if (sessionStatus === "saved" || !gameIdRef.current) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    console.log( "Saving score:", finalScore);

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
          mistakes: wrongAnswers,
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
  }, [wrongAnswers, sessionStatus]);

  const resetGame = () => {
    setGameState("instructions");
    setCountdown(3);
    setTimeLeft(60);
    setScore(0);
    setCurrentStreak(0);
    setHighestStreak(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setShowFinish(false);
    setPlanes([]);
    setCenterDirection(null);
    streakRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  };

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
        if (correctSoundRef.current) {
            correctSoundRef.current.currentTime = 0;
            correctSoundRef.current.play().catch(() => {});
          }
        streakRef.current++;
        const nextStreak = streakRef.current;
        setCurrentStreak(nextStreak);
        setHighestStreak(prev => Math.max(prev, nextStreak));
        const streakPoints = Math.min(nextStreak * 10, 50);
        showFeedback("correct", streakPoints);
        setCorrectAnswers(prev => prev + 1);
        setScore(prev => {
          const nextScore = Math.min(prev + streakPoints, 2000);
          if (nextScore >= 2000) {
            setShowFinish(true);
            setGameState("finished");
          }
          return nextScore;
        });
      } else {
        if (wrongSoundRef.current) {
            wrongSoundRef.current.currentTime = 0;
            wrongSoundRef.current.play().catch(() => {});
          }
        showFeedback("wrong");
        setWrongAnswers(
          prev => prev + 1
        );
        streakRef.current = 0;
        setCurrentStreak(0);
        setScore(
          prev =>
            Math.max(0, prev - 20)
        );
      }
      generateRound();
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
    if (score < 2000) return;
    setScore(2000);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (victorySoundRef.current) {
      victorySoundRef.current.currentTime = 0;
      victorySoundRef.current.play().catch(() => {});
    }
    setShowFinish(true);
    setGameState("finished");
    recordSession(2000);
  }, [score]);

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

  return (
    <div className="attentionflight-page">
      <audio ref={correctSoundRef} src="/assets/audio/correct.mp3"/>
      <audio ref={wrongSoundRef} src="/assets/audio/wrong.mp3"/>
      <audio ref={countSoundRef} src="/assets/audio/countdown.mp3"/>
      <audio ref={startSoundRef} src="/assets/audio/start.mp3"/>
      <audio ref={musicRef} src="/assets/audio/chill-music2.mp3" loop/>
      <audio ref={victorySoundRef} src="/assets/audio/victory.mp3"/>

      {/* INSTRUCTIONS */}

      {gameState === "instructions" && (
        <div className="overlay">
          <div className="modal">
            <h2>Attention Flight</h2>
            <div className="instruction-subtitle">
              Focus on the center aircraft and react
              to its direction as quickly as possible.
            </div>
            <div className="instruction-stats">
              <div className="instruction-stat">
                <span>60s</span>
                <small>Time</small>
              </div>
              <div className="instruction-stat">
                <span>2000</span>
                <small>Max Score</small>
              </div>
              <div className="instruction-stat">
                <span>Attention</span>
                <small>Skill</small>
              </div>
            </div>
            <div className="instructions-rules">
              <div className="rule-item">
                Only the center aircraft matters.
              </div>
              <div className="rule-item">
                Use the arrow keys matching
                the center aircraft direction.
              </div>
              <div className="rule-item">
                Correct answers increase score,
                mistakes decrease score.
              </div>
            </div>
            <button className="ghost-btn" onClick={() => {startTimeRef.current = new Date().toISOString();
               streakRef.current = 0; setCurrentStreak(0); setHighestStreak(0); setCountdown(3); setGameState("countdown");}}>
              <Play size={20} />
              Start Game
            </button>

          </div>
        </div>
      )}

      {/* COUNTDOWN */}

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

      {/* PAUSE */}

      {gameState === "paused" && (
        <div className="overlay">
          <div className="modal">
            <h2>Game Paused</h2>
            <div className="pause-actions">
              <button className="ghost-btn" onClick={() => setGameState("playing")}>
                <Play size={20} />Resume
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                <RotateCcw size={20} /> Restart Game
              </button>
              <button className="ghost-btn" onClick={() => setMusicEnabled(prev => !prev)}>
                <Music size={20} />{musicEnabled ? "Disable Music" : "Enable Music"}
              </button>
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                <DoorOpen size={20} />
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}

      <section className="attentionflight-container">
        <header className="attentionflight-header">
        <button className="menu-btn" onClick={() => setGameState("paused")}>
            <Menu size={24} />
          </button>
          <div className="cardmatch-stats">
            <div className="stat-chip">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Correct</span>
              <span className="stat-value">{correctAnswers}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{currentStreak}</span>
            </div>
            <div className="stat-chip">
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
              {item.type === "correct" ? `✓ +${item.points}` : `✕ -20`}
            </div>
          ))}
        </div>
      </section>

      {/* FINISH */}

      {showFinish && (
        <Confetti
          recycle={false}
          numberOfPieces={300}
        />
      )}

      {showFinish && (
        <div className="finish-backdrop">
          <div className="finish-modal">

            <div className="finish-icon">
              <Trophy size={64} />
            </div>
            <h2 className="finish-title">
              Flight Complete
            </h2>
            <div className="finish-score">
              {score}
            </div>
            <div className="finish-score-label">
              POINTS
            </div>
            <div className="finish-stats">
              <div className="finish-stat">
                <span>{correctAnswers}</span>
                <small>Correct Answers</small>
              </div>
              <div className="finish-stat">
                <span>{highestStreak}</span>
                <small>Highest Streak</small>
              </div>
              <div className="finish-stat">
                <span>
                  {correctAnswers + wrongAnswers > 0
                    ? Math.round(
                        (correctAnswers /
                          (correctAnswers +
                            wrongAnswers)) *
                          100
                      )
                    : 0}
                  %
                </span>
                <small>Accuracy</small>
              </div>
            </div>
            <div className="finish-actions">
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                <DoorOpen /> Exit Game
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                <Play /> Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttentionFlight;