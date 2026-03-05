import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/Assessment.css";
import axios from "axios";

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState("method");
  const handleFitbitStart = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      console.error("No user in localStorage; cannot start Fitbit auth.");
      return;
    }
    window.location.href = `http://127.0.0.1:5000/auth/fitbit/login?user_id=${user.id}`;
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
      question: "What is your stress level?",
      options: [
        { value: 0, label: "Low" },
        { value: 1, label: "Medium" },
        { value: 2, label: "High" }
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

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
        navigate("/dashboard");
      } else {
        alert("Something went wrong");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="home-wrapper">
      <div className="home-card">
        <img
          src="/src/assets/icons/Cognitra.png"
          alt="Cognitra Logo"
          className="home-logo"
        />
      {step === "method" && (
        <div className="assessment-title">
          <h2>Choose Assessment Method</h2>
          
          <div className="method-buttons">
            <button className="primary-btn" onClick={() => setStep("manual")}>
              Fill Manually
            </button>
            <button
              className="primary-btn"
              onClick={handleFitbitStart}
            >
              Import from Fitbit
            </button>
          </div>
          <div className="assessment-text">
            Before you start, we need to gather some information about your lifestyle and habits.
            With the information we can give you feedback on your cognitive health and help you to improve it.
            Please choose one of the following methods to provide this information:
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
          <h2 className="assessment-title">{questions[currentStep].question}</h2>
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
            <button onClick={prevStep} disabled={currentStep === 0} className="nav-btn secondary">
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
