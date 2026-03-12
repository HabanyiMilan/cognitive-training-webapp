import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "@/components/Toast.jsx";
import "../styles/Profile.css";
import "../styles/Index.css";
import "../styles/Assessment.css";
import FloatingLines from '@/components/FloatingLines';
import {FireIcon, HeartIcon} from '@heroicons/react/24/outline'

export default function Profile() {
  const navigate = useNavigate();
  const [step, setStep] = useState("view");
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const questions = [
    {
      key: "sleep_hours",
      question: "How many hours do you sleep a day?",
      options: [
        { value: 0, label: "Less than 7 hours" },
        { value: 1, label: "7-9 hours" },
        { value: 2, label: "More than 9 hours" }
      ]
    },
    {
      key: "caffeine_per_day",
      question: "How much caffeine do you consume daily?",
      options: [
        { value: 0, label: "None" },
        { value: 1, label: "1-2 cups" },
        { value: 2, label: "3+ cups" }
      ]
    },
    {
      key: "daily_screen_time",
      question: "How much screen time per day?",
      options: [
        { value: 0, label: "Less than 2 hours" },
        { value: 1, label: "2-5 hours" },
        { value: 2, label: "More than 5 hours" }
      ]
    },
    {
      key: "stress_level",
      question: "How stressful do you find your daily life?",
      options: [
        { value: 0, label: "Not stressful" },
        { value: 1, label: "Moderately stressful" },
        { value: 2, label: "Highly stressful" }
      ]
    },
    {
      key: "physical_activity",
      question: "How often do you exercise?",
      options: [
        { value: 0, label: "Rarely" },
        { value: 1, label: "Sometimes" },
        { value: 2, label: "Regularly" }
      ]
    }
  ];

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/profile`, { headers: { Authorization: "Bearer " + localStorage.getItem("token") }});
      if (res.status === 401) {
        navigate("/");
        return;
      }
      const data = await res.json();
      setProfile(data);
      if (data.assessment) {
        setFormData({
          sleep_hours: data.assessment.sleep_hours,
          caffeine_per_day: data.assessment.caffeine_per_day,
          daily_screen_time: data.assessment.daily_screen_time,
          stress_level: data.assessment.stress_level,
          physical_activity: data.assessment.physical_activity
        });
      }
    } catch {
      setToast("Could not load profile. Please try again.");
    }
  };

  useEffect(() => {
    fetchProfile();
    const savedMsg = localStorage.getItem("assessment_success");
    if (savedMsg) {
      setToast(savedMsg);
      localStorage.removeItem("assessment_success");
    }
  }, []);

  const handleModify = () => { setStep("method"); setCurrentStep(0); setImporting(false); };
  const handleCancelEdit = () => { setStep("view"); setToast("Assessment changes cancelled."); setCurrentStep(0); setImporting(false); };
  const handleFitbitStart = () => {
  const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      setToast("Please sign in before importing from Fitbit.");
      return;
    }
    setImporting(true);
    setToast("Opening Fitbit to import your data…");
    localStorage.setItem("assessment_success", "Assessment changes saved.");
    setTimeout(() => {
      window.location.href = `http://127.0.0.1:5000/auth/fitbit/login?user_id=${user.id}`;
    }, 120);
  };

  const handleSelect = (value) => {
    setFormData({
      ...formData,
      [questions[currentStep].key]: value
    });
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep === 0) {
      setStep("method");
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const hasAssessment = Boolean(profile?.assessment?.id);
    const url = hasAssessment ? `http://127.0.0.1:5000/assessment/manual/${profile.assessment.id}` : `http://127.0.0.1:5000/assessment/manual`;
    const method = hasAssessment ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setToast("Assessment changes saved.");
        await fetchProfile();
        setStep("view");
        setCurrentStep(0);
      } else {
        setToast("Something went wrong. Please try again.");
      }
    } catch {
      setToast("Network error");
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      const res = await fetch("/profile", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      if (res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.setItem("logout_success", "Account has been deleted.");
        setToast("Account has been deleted.");
        navigate("/");
      } else {
        setToast("Could not delete Account. Please try again.");
      }
    } catch (err) {
      setToast("Network error while deleting profile.");
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  const wallpaper = useMemo(() => (
    <div className="wallpaper-bg">
      <FloatingLines
        enabledWaves={["top","middle","bottom"]}
        lineCount={5}
        lineDistance={5}
        bendRadius={5}
        bendStrength={-0.5}
        interactive={true}
        parallax={true}
      />
    </div>
  ), []);

  if (!profile) {
    return (
      <div className="wallpaper-wrapper">
        {wallpaper}
        <div className="wallpaper-content text-white">
          <Toast message={toast} onClose={() => setToast("")} />
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallpaper-wrapper">
      {wallpaper}
      <div className="wallpaper-content text-white">
        <Toast message={toast} onClose={() => setToast("")} />
        {step === "view" && (
          <>
            <div className="profile-banner">
              <div className="profile-banner__left">
                <img src={profile.user.profile_picture || "/src/assets/icons/avatar.png"} className="profile-banner__avatar"/>
                <div className="profile-banner__text">
                  <h1>{profile.user.name}</h1>
                  <p className="profile-banner__email">{profile.user.email}</p>
                  <p className="profile-banner__since">
                    Member since{" "}
                    {new Date(profile.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="profile-banner__stats">
                <div className="stat-card stat-card--blue">
                  <div className="stat-card__icon"><FireIcon /></div>
                  <div>
                    <p className="stat-card__value">{profile.user.games_played ?? 0}</p>
                    <p className="stat-card__label">Games Played</p>
                  </div>
                </div>

                <div className="stat-card stat-card--blue">
                  <div className="stat-card__icon"><HeartIcon /></div>
                  <div>
                    <p className="stat-card__value">
                      {profile.user.favorite_game_type || "Unknown"}
                    </p>
                    <p className="stat-card__label">Favorite Game Type</p>
                  </div>
                </div>
              </div>

            <button className="profile-banner__action" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
            </div>

              <div className="assessment-card">
                <div className="assessment-header">
                  <h2>Assessment</h2>
                  <p>Your cognitive health habits overview</p>
                </div>

                {profile.assessment ? (
                  <div className="assessment-body">
                    <div className="assessment-columns">
                      <h3>Activities</h3>
                      <h3>Amount</h3>
                    </div>

                    <div className="assessment-rows">
                      <div className="assessment-row">
                        <div>Physical Activity</div>
                        <div>{profile.assessment.activity_label}</div>
                      </div>
                      <div className="assessment-row">
                        <div>Sleep</div>
                        <div>{profile.assessment.sleep_label}</div>
                      </div>
                      <div className="assessment-row">
                        <div>Caffeine</div>
                        <div>{profile.assessment.caffeine_label}</div>
                      </div>
                      <div className="assessment-row">
                        <div>Stress</div>
                        <div>{profile.assessment.stress_label}</div>
                      </div>
                      <div className="assessment-row last">
                        <div>Daily Screen Time</div>
                        <div>{profile.assessment.screen_time_label}</div>
                      </div>
                    </div>

                    <div className="assessment-footer">
                      <button className="primary-btn assessment-btn" onClick={handleModify}>
                        Modify Assessment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="assessment-empty">
                    <p className="text-gray-400">No assessment yet.</p>
                    <button className="primary-btn assessment-btn" onClick={handleModify}>
                      Add Assessment
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {step === "method" && (
            <div className="assessment-card">
              <button className="ghost-btn" onClick={handleCancelEdit}>Cancel</button>
              <div className="assessment-header flex-row">
                <div>
                  <h2>Choose Assessment Method</h2>
                  <p>Update your answers manually or refresh them using Fitbit data.</p>
                </div>
              </div>
              
              <div className="assessment-body centered">
                {importing ? (
                  <div className="import-loading">
                    <div className="spinner" aria-label="Loading" />
                    <p className="import-text">Connecting to Fitbit</p>
                  </div>
                ) : (
                  <div className="method-pills">
                    <button className="pill-btn" onClick={() => setStep("manual")}>
                      Fill Manually
                    </button>
                    <button className="pill-btn" onClick={handleFitbitStart}>
                      Import from Fitbit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "manual" && (
            <div className="assessment-card">
              <button className="ghost-btn" onClick={handleCancelEdit}>Cancel</button>
              <div className="assessment-header flex-row">
                <div>
                  <h2>Manual Assessment</h2>
                  <p>Answer each question to update your assessment.</p>
                </div>
              </div>
                <div className="assessment-body centered">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <h1 className="assessment-title">{questions[currentStep].question}</h1>
                <div className="answers">
                  {questions[currentStep].options.map((option) => (
                    <button key={option.value} className={`answer-btn ${ formData[questions[currentStep].key] === option.value ? "selected" : "" }`} onClick={() => handleSelect(option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="navigation-buttons">
                  <button onClick={prevStep} className="nav-btn secondary">
                    Back
                  </button>
                  {currentStep === questions.length - 1 ? (
                    <button onClick={handleSubmit} disabled={ loading || formData[questions[currentStep].key] === undefined } className="nav-btn primary">
                      {loading ? "Saving..." : "Save"}
                    </button>
                  ) : (
                    <button onClick={nextStep} disabled={formData[questions[currentStep].key] === undefined} className="nav-btn primary">Next</button>
                  )}
                </div>
              </div>
            </div>
          )}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <h3>Are you absolutely sure?</h3>
              <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
              <div className="delete-modal__actions">
                <button className="ghost-btn" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
