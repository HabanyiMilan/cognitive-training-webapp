import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
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

const PAIR_COUNT = 8;

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
  const [sessionStatus, setSessionStatus] = useState("idle");

  const startTimeRef = useRef(new Date().toISOString());
  const finishedRef = useRef(false);
  const timerRef = useRef(null);
  const gameIdRef = useRef(null);
  const timeLimitRef = useRef(300);

  useEffect(() => {
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchGameMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/games?ability=MEMORY`);
        if (!res.ok) return;
        const data = await res.json();
        const cardMatch = data.games?.find((game) => game.slug === "card-match");
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
    setFirstCard(null);
    setLockBoard(false);
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
    }
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
  };

  const recordSession = useCallback(async () => {
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
    if (matches === PAIR_COUNT && !finishedRef.current) {
      finishedRef.current = true;
      setShowFinish(true);
      if (timerRef.current) clearInterval(timerRef.current);
      recordSession();
    }
  }, [matches, recordSession]);

  const handleCardClick = (card) => {
    if (lockBoard || card.matched || card.flipped) return;

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
      setMatches((prev) => prev + 1);
      setFirstCard(null);
      setLockBoard(false);
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

  return (
    <div className="cardmatch-page">
      <header className="cardmatch-header">
        <button className="ghost-btn" onClick={() => navigate("/games")}>
          <ArrowLeft size={16} /> Back to games
        </button>
        <div className="cardmatch-stats">
          <div className="stat-chip">
            <span className="stat-label">Score</span>
            <span className="stat-value">
              {matches}/{PAIR_COUNT}
            </span>
          </div>
          <div className="stat-chip">
            <span className="stat-label">Mistakes</span>
            <span className="stat-value">{mistakes}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <button className="ghost-btn" onClick={resetGame}>
          <RotateCcw size={16} /> Restart
        </button>
      </header>

      <section className="cardmatch-container">
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
              </button>
            ))}
          </div>
        </div>
      </section>

      {showFinish && (
        <div className="finish-backdrop">
          <div className="finish-modal">
            <div className="finish-icon">
              <Trophy size={28} />
            </div>
            <h2>Great job!</h2>
            <p>
              You matched all pairs in {formatTime(elapsed)} with {mistakes} mistake
              {mistakes === 1 ? "" : "s"}.
            </p>
            {sessionStatus === "error" && (
              <p className="error-note">
                We could not save your session. Try again or play another round.
              </p>
            )}
            <div className="finish-actions">
              <button className="ghost-btn" onClick={() => navigate("/games")}>
                Back to games
              </button>
              <button className="ghost-btn" onClick={resetGame}>
                Play again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardMatch;
