import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Assessment.css";
import axios from "axios";
import Toast from "@/components/Toast.jsx";

function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState("method");
  const [importing, setImporting] = useState(false);
  const handleFitbitStart = () => {
  const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      setToast("Please sign in before importing from Fitbit.");
      return;
    }
    setImporting(true);
    setToast("Opening Fitbit to import your data…");
    setTimeout(() => {window.location.href = `http://127.0.0.1:5000/auth/fitbit/login?user_id=${user.id}`;}, 120);
    localStorage.setItem("assessment_success", "Assessment saved successfully.");
  };

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
        { value: 0, label: "Not stressful" },,
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
    },
    {
      key: "concentration_level",
      question: "How often do you do activities that require concentration or thinking?",
      options: [
        { value: 0, label: "Rarely" },
        { value: 1, label: "Sometimes" },
        { value: 2, label: "Regularly" }
      ]
    }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const loginMsg = localStorage.getItem("login_success");
    if (loginMsg) {
      setToast(loginMsg);
      localStorage.removeItem("login_success");
    }

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
    try {
      const response = await fetch("/assessment/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const user = JSON.parse(localStorage.getItem("user"));

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          has_assessment: true
        })
        );
        localStorage.setItem("assessment_success", "Assessment saved successfully.");
        navigate("/home");
      } else {
        alert("Something went wrong");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="home-wrapper">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="home-card">
        <img
          src="/src/assets/icons/Cognitra.png"
          alt="Cognitra Logo"
          className="home-logo"
        />
      {step === "method" && (
        <div className="assessment-title">
          <h2>Choose Assessment Method</h2>
          
          {importing ? (
            <div className="import-loading">
              <div className="spinner" aria-label="Loading" />
              <p className="import-text">Connecting to Fitbit</p>
            </div>
          ) : (
            <div className="method-buttons">
              <button className="primary-btn" onClick={() => setStep("manual")}>
                Fill Manually
              </button>
              <button className="primary-btn" onClick={handleFitbitStart}>
                Import Fitbit
              </button>
            </div>
          )}
          <div className="assessment-text">
            Before you start, we need to gather some information about your lifestyle and habits.
            With the information we can give you feedback on your cognitive health and help you to improve it.
            Please choose one of the following methods to provide this information.
          </div>
        </div>
      )}
      
      {step === "manual" && (
        <>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <h1 className="assessment-title">{questions[currentStep].question}</h1>
          <div className="answers">
            {questions[currentStep].options.map(option => (
              <button
                key={option.value}
                className={`answer-btn ${
                  formData[questions[currentStep].key] === option.value ? "selected" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="navigation-buttons">
            <button onClick={prevStep} className="nav-btn secondary">
              Back
            </button>
            {currentStep === questions.length - 1 ? (
              <button onClick={handleSubmit} disabled={loading || formData[questions[currentStep].key] === undefined} className="nav-btn primary">
                {loading ? "Submitting..." : "Submit"}
              </button>
            ) : (
              <button onClick={nextStep} disabled={formData[questions[currentStep].key] === undefined} className="nav-btn primary">
                Next
              </button>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default Assessment;