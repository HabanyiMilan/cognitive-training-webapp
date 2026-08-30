import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import "../styles/LandingPage.css";
import game1 from "../assets/images/game1.png";
import gamespage from "../assets/images/gamespage.png";
import statisticspage from "../assets/images/statisticspage.png";
import assessments from "../assets/images/assessments.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";

function LandingPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  useEffect(() => {
    const logout = localStorage.getItem("logout_success");
    if (!logout) return;

    setToast({ message: logout, type: "success" });
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
      setToast({ message: "Something went wrong while signing in.", type: "error" });
    }
  };
  
  const handleError = () => {
    console.log("Google Login Failed");
    setToast({ message: "Google sign-in failed. Please try again.", type: "error" });
  };
  
   return (
    <div className="landing-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
      <div className="landing-glow landing-glow-green" />
      <div className="landing-glow landing-glow-orange" />
      <main className="landing-hero" id="home">
        <section className="landing-content">
          <div className="landing-nav-logo">
            <img src="/src/assets/icons/Cognitra.png" alt="Cognitra" />
          </div>
          <h1>
            Your cognitive
            <span> playground.</span>
          </h1>

          <p className="landing-description">
            Improve your memory, attention and problem-solving skills
            through interactive cognitive games while tracking your
            progress over time.
          </p>

          <div className="landing-actions">
            <div className="login-container">
              <GoogleLogin onSuccess={handleLoginSuccess} onError={handleError} logo_alignment="center" shape="pill" locale="en"/>
            </div>
          </div>

          <div className="landing-stats">
            <div>
              <strong>Different Game Types</strong>
            </div>
            <div>
              <strong>Performance Monitoring</strong>
            </div>
            <div>
              <strong>AI Insights</strong>
            </div>
          </div>
        </section>

        <section className="landing-visual">
          <div className="swiper-wrapper-custom">
            <div className="swiper-glow" />
            <Swiper className="landing-swiper" modules={[Autoplay, EffectFade]} effect="fade" fadeEffect={{ crossFade: true }} autoplay={{ delay: 5000, disableOnInteraction: false,}}loop speed={900}>
              <SwiperSlide>
                <img src={game1} alt="Cognitra game" />
              </SwiperSlide>

              <SwiperSlide>
                <img src={gamespage} alt="Cognitra games"/>
              </SwiperSlide>

              <SwiperSlide>
                <img src={statisticspage} alt="Cognitra statistics"/>
              </SwiperSlide>

              <SwiperSlide>
                <img src={assessments} alt="Cognitra assessments"/>
              </SwiperSlide>
            </Swiper>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;