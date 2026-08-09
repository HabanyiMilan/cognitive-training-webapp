import "../styles/LoadingScreen.css";
import FloatingLines from "@/components/FloatingLines";
import { createPortal } from "react-dom";

function LoadingScreen({ text = "Initializing..." }) {
  return createPortal(
    <div className="loading-screen">
      <div className="wallpaper2-bg">
        <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive
            parallax
        />
      </div>
      <div className="loading-content">

        <img src="/src/assets/icons/Cognitra.png" alt="Cognitra Logo" className="landing-logo"/>
        <p className="loading-text">
          {text}
        </p>

        <div className="loading-bar">
          <div className="loading-fill" />
        </div>

      </div>
    </div>, 
    document.body
  );
}

export default LoadingScreen;