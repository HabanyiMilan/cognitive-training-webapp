import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/auth/google", {
        token: credentialResponse.credential,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/home");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  const handleError = () => {
    console.log("Google Login Failed");
  };
  
  return (
     <div className="home-container">
      <h1>Cognitive Training</h1>
      <p className="subtitle">
        Train memory, attention and problem solving.
      </p>
      <div style={{ marginTop: "20px" }}>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}

export default Login;