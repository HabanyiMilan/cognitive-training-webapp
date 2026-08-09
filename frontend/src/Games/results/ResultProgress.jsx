import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const score = payload.find(item => item.dataKey === "score")?.value ?? 0;
  const playersAverage = payload.find(item => item.dataKey === "players_average")?.value ?? 0;
  const difference = score - playersAverage;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-title">
        Session #{label}
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          Your score
        </span>
        <strong className="tooltip-score">
          {score.toLocaleString()}
        </strong>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          Players average
        </span>
        <strong className="tooltip-average">
          {playersAverage.toLocaleString()}
        </strong>
      </div>
      <div className="tooltip-divider" />
      <div className="tooltip-row tooltip-difference">
        <span className="tooltip-label">
          Difference
        </span>
        <strong className={ difference > 0 ? "positive" : difference < 0 ? "negative" : "neutral"}>
          {difference > 0 ? "+" : ""}
          {difference.toLocaleString()}
        </strong>
      </div>
    </div>
  );
}

function ResultProgress({ result }) {
  const { trend = [] } = result;
  return (
    <div className="result-progress-page">

      <h2>Your Progress</h2>

      <div className="progress-chart">

        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="attempt" stroke="#64748b" tickFormatter={(value) => `${value}. time`}/>
                <YAxis stroke="#64748b"/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend />
                <Line
                type="monotone"
                dataKey="score"
                name="Your score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
            />

            <Line
                type="monotone"
                dataKey="players_average"
                name="Players average"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
            />
            </LineChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}

export default ResultProgress;