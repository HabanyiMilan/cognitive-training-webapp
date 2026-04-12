import React, { useEffect, useMemo, useState } from "react";
import "../styles/Statistics.css";
import { Brain, Eye, Handshake, ChartColumn, ChartLine, BadgeCheck, Sun, Calendar1, TrendingUp, AlertTriangle, EqualApproximately, Gamepad2, Clock3, Timer, ChevronRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

const API_BASE = "http://127.0.0.1:5000";

const abilityMeta = {
  MEMORY: { label: "Memory", color: "#a889ff", icon: <Brain size={24} /> },
  ATTENTION: { label: "Attention", color: "#4bb5ff", icon: <Eye size={24} /> },
  PROBLEM_SOLVING: { label: "Problem Solving", color: "#ffcb5a", icon: <Handshake size={24} /> },
};

function Statistics() {
  const [stats, setStats] = useState(null);

  const [selectedAbility, setSelectedAbility] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [abilityProgress, setAbilityProgress] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch statistics", err);
      }
    };

    fetchStats();
  }, []);

  const abilities = stats?.abilities || {};
  const general = stats?.general || {};
  const activity = stats?.activity || [];
  const insights = stats?.insights || [];
  const comparison = stats?.comparison || {};
  const progress = stats?.progress || [];

  const handleAbilityClick = async (abilityKey) => {
  setLoadingAI(true);
  setSelectedAbility(abilityKey);
  setAiData(null);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/statistics/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ability: abilityKey })
    });

    const data = await res.json();
    if (data.error) {
      console.error(data.error);
      setLoadingAI(false);
      return;
    }

    setAiData(data.analysis);
    setAbilityProgress(data.progress || []);

  } catch (err) {
    console.error(err);
  }

  setLoadingAI(false);
};

  const chartData = Object.keys(comparison).map((key) => ({
    name: abilityMeta[key]?.label,
    You: comparison[key]?.user || 0,
    Others: comparison[key]?.average || 0,
  }));

  const activityMap = useMemo(() => {
    const map = {};
    activity.forEach((d) => {
        map[d.date] = d.count;
      });
      return map;
    }, [activity]);

  const calendarData = useMemo(() => {
  const days = [];
  const today = new Date();

  for (let i = 69; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const dateStr = d.toISOString().split("T")[0];

    days.push({
      date: dateStr,
      count: activityMap[dateStr] || 0,
      day: d.getDay(),
    });
  }
    return days;
  }, [activityMap]);
  const weeks = [];
  let currentWeek = [];

  calendarData.forEach((day, i) => {
    currentWeek.push(day);

    if (day.day === 0 || i === calendarData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (count) => {
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count < 2) return "rgba(75,181,255,0.3)";
    if (count < 4) return "rgba(75,181,255,0.6)";
    return "rgba(75,181,255,1)";
  };
  const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#0c1326",
        padding: "8px 12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <p style={{ color: "#9fb4d8", margin: 0 }}>{label}</p>
        <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
          ● {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

  if (!stats) {
    return <div className="statistics-page">Loading...</div>;
  }

  if (selectedAbility) {
    return (
      <div className="statistics-page ai-page">
        <div className="ai-topbar">
          <button onClick={() => { setSelectedAbility(null); setAiData(null); }} className="back-button">
            Back
          </button>
          
          <h2 className="ai-title">{abilityMeta[selectedAbility]?.label} - AI Analysis</h2>
        </div>

        {loadingAI ? (
          <div className="ai-card-loading">
            <div className ="spinner" />
            <p className="muted">Analyzing {abilityMeta[selectedAbility]?.label} ability in progress...</p>
          </div>
        ) : aiData ? (
          <div className="ai-wrapper">
            <div className="ai-card overview">
              <div className="ai-card-title">
                <Brain size={20} />
                <span>AI Overview</span>
              </div>
              <p className="ai-overview">{aiData?.overview || "No overview available."}</p>
            </div>
            {abilityProgress.length > 0 && (
            <div className="ai-card chart">
              <div className="ai-card-title">
                <ChartLine size={20} />
                <span>Your {abilityMeta[selectedAbility]?.label} Progress Trend</span>
              </div>

              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <AreaChart data={abilityProgress}>
                    <defs>
                      <linearGradient id="colorAbility" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4bb5ff" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#4bb5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                    <XAxis dataKey="date" tick={{ fill: "#8aa0c4", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#8aa0c4", fontSize: 11 }} />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4bb5ff"
                      strokeWidth={2}
                      fill="url(#colorAbility)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}

            <div className="ai-card positive">
              <div className="ai-card-title">
                <TrendingUp size={20} />
                <span>Strengths</span>
              </div>
              <ul className="ai-list">
                {aiData?.strengths?.map((s, i) => (
                  <li key={i}>
                    <TrendingUp size={16} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ai-card warning">
              <div className="ai-card-title">
                <AlertTriangle size={20} />
                <span>Weaknesses</span>
              </div>
              <ul className="ai-list">
                {aiData?.weaknesses?.map((w, i) => (
                  <li key={i}>
                    <AlertTriangle size={16} />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ai-card info">
              <div className="ai-card-title">
                <EqualApproximately size={20} />
                <span>Personalized Recommendations</span>
              </div>
              <ul className="ai-list">
                {aiData?.recommendations?.map((r, i) => (
                  <li key={i}>
                    <EqualApproximately size={16} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="ai-card">
            <p className="muted">Select an ability to view its AI overview.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <header className="stats-hero">
        <div>
          <h1>Statistics</h1>
          <p className="sub">Track your cognitive performance and compare with others.</p>
        </div>
      </header>

      <div className="stats-layout">
        <div className="top-row">
          <section className="card ability-card">
            <h2 className="card-title">
              <Brain size={24} />
              <span>Cognitive Abilities</span>
            </h2>

            <div className="ability-list">
              {Object.entries(abilities).map(([key, values]) => {
                const meta = abilityMeta[key];

                return (
                  <div className="ability-row" key={key} onClick={() => handleAbilityClick(key)} style={{ cursor: "pointer" }}>
                    <div className="ability-id">
                      <div className="ability-icon" style={{ background: `${meta.color}22`, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className="ability-name">{meta.label}</p>
                        <p className="muted">Sessions: {values.sessions}</p>
                      </div>
                    </div>

                    <div className="ability-metrics">
                      <div>
                        <p className="metric-label">Best</p>
                        <p className="metric-value">{values.best}</p>
                      </div>
                      <div>
                        <p className="metric-label">Average</p>
                        <p className="metric-value">{values.average}</p>
                      </div>
                    </div>
                    <p className="chevron">
                      <ChevronRight size={18} />
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="card chart-card">
            <h2 className="card-title">
              <ChartColumn size={24} />
              <span>You vs Others</span>
            </h2>

            {chartData.length ? (
              <div className="modern-bar-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="name" tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background: "#0c1326", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff"}}/>
                    <Bar dataKey="You" fill="#4bb5ff" radius={[6, 6, 0, 0]}/>
                    <Bar dataKey="Others" fill="#7287a9" radius={[6, 6, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>

                <div className="legend modern">
                  <span>
                    <span className="dot primary" /> You
                  </span>
                  <span>
                    <span className="dot muted-dot" /> Others
                  </span>
                </div>
              </div>
            ) : (
              <p className="muted">No comparison data yet</p>
            )}
          </section>

          <section className="card progress-card">
            <h2 className="card-title">
              <ChartLine size={24} />
              <span>Overall Cognitive Progress</span>
            </h2>
            {progress.length ? (
            <div className="progress-linechart modern">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={progress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4bb5ff" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4bb5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false}/>
                  <YAxis tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false} width={40}/>
                  <XAxis dataKey="date" tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="score" stroke="#4bb5ff" strokeWidth={3} fill="url(#colorScore)" dot={false} activeDot={{ r: 6, stroke: "#0c1326", strokeWidth: 2, fill: "#4bb5ff" }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
              <p className="muted">Play more to see progress</p>
            )}
          </section>
        </div>

        <div className="middle-row">
          <section className="card">
            <h2 className="card-title">
              <BadgeCheck size={24} />
              <span>General Statistics</span>
            </h2>

            <div className="general-row">
              <div className="general-item">
                <div className="general-header">
                  <Clock3 size={20} />
                  <span className="metric-label">Total Time Trained</span>
                </div>
                <p className="metric-value large center">
                  {Math.round(general.total_time / 60)} min
                </p>
              </div>

              <div className="general-item">
                <div className="general-header">
                  <Timer size={20} />
                  <span className="metric-label">Avg Session Duration</span>
                </div>
                <p className="metric-value large center">
                  {Math.round(general.avg_session)} sec
                </p>
              </div>

              <div className="general-item">
                <div className="general-header">
                  <Gamepad2 size={20} />
                  <span className="metric-label">Avg Mistakes Count</span>
                </div>
                <p className="metric-value large center">
                  {Math.round(general.avg_mistakes)} mistakes
                </p>
              </div>
            </div>
          </section>

          <section className="card insights-card">
            <h2 className="card-title">
              <Sun size={24} />
              <span>Insights</span>
            </h2>
            <ul className="insights-list">
              {insights.map((item, i) => (
                <li key={i} className={`insight-row ${item.type || "neutral"}`}>
                  <div className="insight-icon">
                    {item.type === "positive" && <TrendingUp size={18} />}
                    {item.type === "warning" && <AlertTriangle size={18} />}
                    {(!item.type || item.type === "neutral") && <EqualApproximately size={18} />}
                  </div>
                  <div className="insight-body">
                    <p className="insight-title">{item.title || "Insight"}</p>
                    <p className="insight-text">{item.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="bottom-row">
          <section className="card calendar-card">
            <div className="calendar-header">
              <h2 className="card-title">
                <Calendar1 size={24} />
                <span>Activity Calendar</span>
              </h2>
              <div className="calendar-legend">
                <span>Less</span>
                <div className="legend-scale">
                  <span style={{ background: "rgba(255,255,255,0.05)" }} />
                  <span style={{ background: "rgba(75,181,255,0.3)" }} />
                  <span style={{ background: "rgba(75,181,255,0.6)" }} />
                  <span style={{ background: "rgba(75,181,255,1)" }} />
                </div>
                <span>More</span>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-days">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              <div className="calendar-weeks">
                {weeks.map((week, i) => (
                  <div key={i} className="calendar-week">
                    {week.map((day, j) => (
                      <div key={j} className="calendar-cell" style={{ background: getColor(day.count) }} title={`${day.date} - ${day.count} sessions`}/>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
