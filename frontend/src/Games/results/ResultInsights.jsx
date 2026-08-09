

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");

  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${mins}:${secs}`;
}

function ResultInsights({ result }) {

  const { mistakes, time, comparison, insights } = result;

  const insights2 = [];


  if (comparison.difference > 0) {

    insights2.push({
      type: "positive",
      title: "Above Average",
      text: `Your score is ${comparison.difference} points above the average player.`
    });

  } else if (comparison.difference < 0) {

    insights2.push({
      type: "warning",
      title: "Room for Improvement",
      text: `Your score is ${Math.abs(comparison.difference)} points below the average player.`
    });

  }


  if (time.current > time.best) {

    insights2.push({
      type: "warning",
      title: "Work on Speed",
      text: `Your best time is ${formatTime(time.best)}, while this session took ${formatTime(time.current)}.`
    });

  } else {

    insights2.push({
      type: "positive",
      title: "Great Speed",
      text: "You matched or improved your personal best time."
    });
  }

  if (mistakes.current > mistakes.lowest_mistakes) {

    insights2.push({
      type: "warning",
      title: "Reduce Mistakes",
      text: `You made ${mistakes.current} mistakes this session. Your personal best is ${mistakes.lowest_mistakes}.`
    });

  } else {

    insights2.push({
      type: "positive",
      title: "Excellent Accuracy",
      text: "You matched your best mistake count or performed even better."
    });

  }

  return (
    <div className="result-content">
      <h2>Performance Insights</h2>
      <div className="insight-list">
        {insights.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.type}`}>
            <div className="insight-content">
              <h3 className={insight.type == "positive" ? "positive" : "warning"}>
                {insight.title}
              </h3>

              <p>
                {insight.text}
              </p>
            </div>
          </div>
        ))}
        {insights2.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.type}`}>
            <div className="insight-content">
              <h3 className={insight.type == "positive" ? "positive" : "warning"}>
                {insight.title}
              </h3>

              <p>
                {insight.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResultInsights;