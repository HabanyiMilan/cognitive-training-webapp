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

import { Autoplay } from "swiper/modules";

import "swiper/css";

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
        <div className="landing-left">
          <img src="/src/assets/icons/Cognitra.png" alt="Cognitra Logo" className="landing-logo"/>

          <p className="landing-subtitle">
            Your cognitive playground.
          </p>

          <div className="login-container">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleError}
              logo_alignment="center"
              shape="pill"
              locale="en"
            />
          </div>

          <p className="landing-description">
            Improve your memory, attention and problem-solving skills
            through interactive games while tracking your progress.
          </p>
        </div>

        <div className="landing-right">
          <Swiper
            className="landing-swiper"
            modules={[Autoplay]}
            autoplay={{
                delay: 5000,
                disableOnInteraction: false,
            }}
            loop
            speed={700}
        >

            <SwiperSlide>

                <img src={game1} />

            </SwiperSlide>

            <SwiperSlide>

                <img src={gamespage} />

            </SwiperSlide>

            <SwiperSlide>

                <img src={statisticspage} />

            </SwiperSlide>

            <SwiperSlide>

                <img src={assessments} />

            </SwiperSlide>

        </Swiper>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;