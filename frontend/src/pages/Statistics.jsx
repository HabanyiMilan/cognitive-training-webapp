import React, { useEffect, useState } from "react";
import "../styles/Statistics.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faEye, faBrain, faClipboardCheck, faChartSimple, faChartArea, faGlobe, faLightbulb, faArrowTrendUp, faArrowTrendDown, faEquals } from "@fortawesome/free-solid-svg-icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import Toast from "@/components/Toast.jsx";

const API_BASE = "http://127.0.0.1:5000";

const abilityMeta = {
  MEMORY: { label: "Memory", color: "#a889ff", icon: <FontAwesomeIcon icon={faBrain} size="xl" /> },
  ATTENTION: { label: "Attention", color: "#4bb5ff", icon: <FontAwesomeIcon icon={faEye} size="xl" /> },
  PROBLEM_SOLVING: { label: "Problem Solving", color: "#ffcb5a", icon: <FontAwesomeIcon icon={faClipboardCheck} size="xl" /> },
};

function Statistics() {
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
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
        setToast({ message: "Failed to load statistics.", type: "error" });
      }
    };

    fetchStats();
  }, []);

  const abilities = stats?.abilities || {};
  const general = stats?.general || {};
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ability: abilityKey }),
      });

      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        setToast({ message: "Failed to load statistics.", type: "error" });
        setLoadingAI(false);
        return;
      }

      setAiData(data.analysis);
      setAbilityProgress(data.progress || []);
    } catch (err) {
      console.error(err);
      setToast({ message: err, type: "error" });
    }

    setLoadingAI(false);
  };

  const chartData = Object.keys(comparison).map((key) => ({
    name: abilityMeta[key]?.label,
    You: comparison[key]?.user || 0,
    Others: comparison[key]?.average || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#0c1326",
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
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
          <button
            onClick={() => {
              setSelectedAbility(null);
              setAiData(null);
            }}
            className="back-button"
          >
            Back
          </button>

          <h2 className="ai-title">{abilityMeta[selectedAbility]?.label} - AI Analysis</h2>
        </div>

        <div className="ai-scroll-area">
          {loadingAI ? (
            <div className="ai-card-loading">
              <div className="ai-loader">
                <div className="ai-box"></div>
                <div className="ai-box"></div>
                <div className="ai-box"></div>
                <div className="ai-box"></div>
                <div className="ai-box"></div>
              </div>

              <p className="muted">
                AI is currently working on Analyzing your {abilityMeta[selectedAbility]?.label} ability.
              </p>
            </div>
          ) : aiData ? (
            <div className="ai-wrapper">
              <div className="ai-card overview">
                <div className="ai-card-title">
                  <FontAwesomeIcon icon={faBrain} size="xl" />
                  <span>AI Overview</span>
                </div>
                <p className="ai-overview">{aiData?.overview || "No overview available."}</p>
              </div>
              {abilityProgress.length > 0 && (
                <div className="ai-card chart">
                  <div className="ai-card-title">
                    <FontAwesomeIcon icon={faChartArea} size="xl" />
                    <span>Your {abilityMeta[selectedAbility]?.label} Progress Trend</span>
                  </div>

                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <AreaChart data={abilityProgress}>
                        <defs>
                          <linearGradient id="colorAbility" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4bb5ff" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#4bb5ff" stopOpacity={0} />
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
                  <FontAwesomeIcon icon={faArrowTrendUp} size="xl" />
                  <span>Strengths</span>
                </div>
                <ul className="ai-list">
                  {aiData?.strengths?.map((s, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faArrowTrendUp} size="xl" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ai-card warning">
                <div className="ai-card-title">
                  <FontAwesomeIcon icon={faArrowTrendDown} size="xl" />
                  <span>Weaknesses</span>
                </div>
                <ul className="ai-list">
                  {aiData?.weaknesses?.map((w, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faArrowTrendDown} size="xl" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ai-card info">
                <div className="ai-card-title">
                  <FontAwesomeIcon icon={faEquals} size="xl" />
                  <span>Personalized Recommendations</span>
                </div>
                <ul className="ai-list">
                  {aiData?.recommendations?.map((r, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faEquals} size="xl" />
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
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <header className="stats-hero">
        <div>
          <h1>Statistics</h1>
          <p className="sub">Track your cognitive performance and compare with others.</p>
        </div>
      </header>

      <div className="stats-layout">
        <section className="card ability-card">
          <h2 className="card-title">
            <FontAwesomeIcon icon={faBrain} size="xl" />
            <span>Cognitive Abilities</span>
          </h2>

          <div className="ability-list">
            {Object.entries(abilities).map(([key, values]) => {
              const meta = abilityMeta[key];
              const max = Math.max(values.best || 0, 1);
              const ratio = Math.min(100, Math.round(((values.average || 0) / max) * 100));

              return (
                <div
                  className="ability-row"
                  key={key}
                  style={{ "--ability-color": meta.color }}
                >
                  <div className="ability-top">
                    <div className="ability-id">
                      <div className="ability-icon" style={{ background: `${meta.color}22`, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className="ability-name">{meta.label}</p>
                        <p className="muted">Sessions: {values.sessions}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ask-ai-btn"
                      onClick={() => handleAbilityClick(key)}
                    >
                      <FontAwesomeIcon icon={faRobot} size="lg" />
                      <span>Ask AI Analysis</span>
                    </button>
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

                  <div className="ability-bar-track">
                    <div
                      className="ability-bar-fill"
                      style={{ width: `${ratio}%`, background: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="right-column">
          <div className="right-grid">
            <div className="graphs-col">
              <section className="card chart-card">
                <h2 className="card-title">
                  <FontAwesomeIcon icon={faChartSimple} size="xl" />
                  <span>You vs Others</span>
                </h2>

                {chartData.length ? (
                  <div className="modern-bar-chart">
                    <div className="chart-fill">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "#0c1326",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "10px",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="You" fill="#4bb5ff" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="Others" fill="#7287a9" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

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
                  <FontAwesomeIcon icon={faChartArea} size="xl" />
                  <span>Overall Cognitive Progress</span>
                </h2>
                {progress.length ? (
                  <div className="progress-linechart modern">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progress} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4bb5ff" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#4bb5ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <YAxis tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                        <XAxis dataKey="date" tick={{ fill: "#8aa0c4", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#4bb5ff"
                          strokeWidth={3}
                          fill="url(#colorScore)"
                          dot={false}
                          activeDot={{ r: 6, stroke: "#0c1326", strokeWidth: 2, fill: "#4bb5ff" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="muted">Play more to see progress</p>
                )}
              </section>
            </div>

            <div className="side-col">
              <section className="card general-card">
                <h2 className="card-title">
                  <FontAwesomeIcon icon={faGlobe} size="xl" />
                  <span>General Statistics</span>
                </h2>

                <div className="general-row compact">
                  <div className="general-item compact">
                    <div>
                      <p className="metric-label">Total Time Trained</p>
                      <p className="metric-value">{Math.round(general.total_time / 60)} min</p>
                    </div>
                  </div>

                  <div className="general-divider" />

                  <div className="general-item compact">
                    <div>
                      <p className="metric-label">Avg Session Duration</p>
                      <p className="metric-value">{Math.round(general.avg_session)} sec</p>
                    </div>
                  </div>

                  <div className="general-divider" />

                  <div className="general-item compact">
                    <div>
                      <p className="metric-label">Avg Mistakes Count</p>
                      <p className="metric-value">{Math.round(general.avg_mistakes)} mistakes</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card insights-card">
                <h2 className="card-title">
                  <FontAwesomeIcon icon={faLightbulb} size="xl" />
                  <span>Insights</span>
                </h2>
                <ul className="insights-list">
                  {insights.map((item, i) => (
                    <li key={i} className={`insight-row ${item.type || "neutral"}`}>
                      <div className="insight-icon">
                        {item.type === "positive" && <FontAwesomeIcon icon={faArrowTrendUp} size="xl" />}
                        {item.type === "warning" && <FontAwesomeIcon icon={faArrowTrendDown} size="xl" />}
                        {(!item.type || item.type === "neutral") && <FontAwesomeIcon icon={faEquals} size="xl" />}
                      </div>
                      <div className="insight-body">
                        <p className="insight-text">{item.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
