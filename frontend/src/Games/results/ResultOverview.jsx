import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedScore({ target }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 4000;
    const startTime = performance.now();

    let animationFrame;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.floor(target * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [target]);

  return (
    <span className="result-score">
      {displayScore}
    </span>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${mins}:${secs}`;
}

function MetricRow({label, current, average, status, currentDisplay, averageDisplay}) {
  return (
    <div className="metric-row">

      <div className="metric-name">
        {label}
      </div>

      <div className="metric-value">
        {currentDisplay ?? current}
      </div>

      <div className="metric-value">
        {averageDisplay ?? average}
      </div>

      <div className={`metric-result ${status}`}>

        {status === "positive" && (
          <TrendingUp size={20} />
        )}

        {status === "negative" && (
          <TrendingDown size={20} />
        )}

        {status === "neutral" && (
          <Minus size={20} />
        )}

        <span>
          {status === "positive" && "Improved"}
          {status === "negative" && "Declined"}
          {status === "neutral" && "No change"}
        </span>

      </div>
    </div>
  );
}

function ResultOverview({ result }) {

  const {score, time, mistakes} = result;

  let scoreStatus;

  if (score.delta > 0) {
    scoreStatus = "positive";
  } else if (score.delta < 0) {
    scoreStatus = "negative";
  } else {
    scoreStatus = "neutral";
  }

  let timeStatus;

  if (time.current < time.average) {
    timeStatus = "positive";
  } else if (time.current > time.average) {
    timeStatus = "negative";
  } else {
    timeStatus = "neutral";
  }

  let mistakesStatus;

  if (mistakes.current < mistakes.average) {
    mistakesStatus = "positive";
  } else if (mistakes.current > mistakes.average) {
    mistakesStatus = "negative";
  } else {
    mistakesStatus = "neutral";
  }

  return (
    <div className="result-content">
      <div className="result-title">
        <div className="result-icon">
            <Trophy size={50} />
        </div>
        <h2>Game Overview</h2>
        <div className="result-icon">
            <Trophy size={50} />
        </div>
      </div>

      <div className="result-main-score">
        <div className="score-line">
          <AnimatedScore target={score.current} />

          <span className="result-score-label">
            POINTS
          </span>
        </div>
        {score.new_personal_best && (
          <div className="personal-best">
            New Personal Best!
          </div>
        )}
        {score.delta !== null && score.new_personal_best === false && (
        <div className={`score-change ${scoreStatus}`}>
            {scoreStatus === "positive" && (<TrendingUp size={20} />)}

            {scoreStatus === "negative" && (<TrendingDown size={20} />)}

            {scoreStatus === "neutral" && (<Minus size={20} />)}

            <span>
            {scoreStatus === "positive" && `${score.delta} points better than your average`}

            {scoreStatus === "negative" && `${Math.abs(score.delta)} points worse than your average`}

            {scoreStatus === "neutral" && "Your score is unchanged from your average"}
            </span>
        </div>
        )}
      </div>

      <div className="result-metrics">
        <div className="metrics-header">
          <span>Your Performances</span>
          <span>Current</span>
          <span>Average</span>
          <span>Result</span>
        </div>
        <MetricRow
          label="Time needed"
          current={time.current}
          average={time.average}
          currentDisplay={formatTime(time.current)}
          averageDisplay={formatTime(time.average)}
          status={timeStatus}
        />
        <MetricRow
          label="Mistakes made"
          current={mistakes.current}
          average={result.mistakes.average}
          status={mistakesStatus}
        />
        <MetricRow
          label="Score"
          current={score.current}
          average={score.average}
          status={scoreStatus}
        />
      </div>
    </div>
  );
}

export default ResultOverview;