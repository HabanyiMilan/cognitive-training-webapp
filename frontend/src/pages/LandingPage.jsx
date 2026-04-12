import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  useEffect(() => {
    const logout = localStorage.getItem("logout_success");
    if (!logout) return;

    setToast(logout);
    localStorage.removeItem("logout_success");
  }, []);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/auth/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("login_success",`Signed in successfully.`);

      if (response.data.user.has_assessment) {
        navigate("/home");
      } else {
        navigate("/assessment");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const handleError = () => {
    console.log("Google Login Failed");
  };

  return (
    <div className="landing-wrapper">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="landing-card">
        <img src="/src/assets/icons/Cognitra.png" alt="Cognitra Logo" className="landing-logo"/>
        <div className="login-container">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleError}
            logo_alignment="center"
            shape="pill"
            locale="en"
          />
        </div>
        <div className="landing-text">
          <p>
            Cognitive abilities such as memory, attention, and problem-solving play a fundamental role
            in everyday performance and long-term development. 
            These mental processes determine how we process information, how quickly we react, 
            and how effectively we make decisions.
          </p>

          <p>
            Cognitra is designed to enhance memory, attention, and problem-solving skills through structured tasks,
            while providing detailed statistical analysis to help you gain clear insight into your progress
            and achieve better results.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;