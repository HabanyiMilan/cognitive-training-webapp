import { useEffect, useState } from "react";

import planeUp from "../Images/Plane-up.png";
import planeDown from "../Images/Plane-down.png";
import planeLeft from "../Images/Plane-left.png";
import planeRight from "../Images/Plane-right.png";

import { ArrowBigLeft, ArrowBigDown, ArrowBigRight, ArrowBigUp, Check, X } from "lucide-react"

import "../AttentionFlight.css";

const directions = ["up", "right", "down", "left"];

const planeImages = {
  up: planeUp,
  down: planeDown,
  left: planeLeft,
  right: planeRight,
};

const arrowSymbols = {
  up: <ArrowBigUp />,
  down: <ArrowBigDown />,
  left: <ArrowBigLeft />,
  right: <ArrowBigRight />
};

function TutorialKeyboard({ mode }) {
  const [activeDirection, setActiveDirection] = useState("right");
  const [animationKey, setAnimationKey] = useState(0);
  useEffect(() => {
    if (mode !== "correct") return;

    const interval = setInterval(() => {
      setActiveDirection(prev => {
        const currentIndex = directions.indexOf(prev);
        return directions[(currentIndex + 1) % directions.length];
      });

      setAnimationKey(prev => prev + 1);
    }, 1300);

    return () => clearInterval(interval);
  }, [mode]);

  if (mode === "wrong") {
    return (
      <div className="tutorial-demo tutorial-wrong-demo">
        <div className="tutorial-feedback">
          <span className="tutorial-feedback-x"><X size={36} /></span>
        </div>
        <div className="tutorial-plane-area">
          <img key={animationKey} src={planeRight} className="tutorial-plane" alt="Plane facing right"/>
        </div>
        <div className="tutorial-keyboard">
          <div className="tutorial-key-spacer" />
          <div className="tutorial-key">
            {arrowSymbols.up}
          </div>
          <div className="tutorial-key-spacer" />
          <div className="tutorial-key tutorial-key-wrong">
            {arrowSymbols.left}
          </div>
          <div className="tutorial-key">
            {arrowSymbols.down}
          </div>
          <div className="tutorial-key">
            {arrowSymbols.right}
          </div>
        </div>
      </div>
    );
  }

  /*
   * FIRST PAGE
   */
  return (
    <div className="tutorial-demo tutorial-correct-demo">
      <div className="tutorial-feedback">
        <span className="tutorial-feedback-check"><Check size={36} /></span>
      </div>
      <div className="tutorial-plane-area">
        <img key={animationKey} src={planeImages[activeDirection]} className="tutorial-plane" alt={`Plane facing ${activeDirection}`}/>
      </div>
      <div className="tutorial-keyboard">
        <div className="tutorial-key-spacer" />
        <div className={`tutorial-key ${ activeDirection === "up" ? "tutorial-key-active" : "" }`}>
          {arrowSymbols.up}
        </div>
        <div className="tutorial-key-spacer" />
        <div className={`tutorial-key ${ activeDirection === "left" ? "tutorial-key-active" : "" }`}>
          {arrowSymbols.left}
        </div>
        <div className={`tutorial-key ${ activeDirection === "down" ? "tutorial-key-active" : "" }`}>
          {arrowSymbols.down}
        </div>
        <div className={`tutorial-key ${ activeDirection === "right" ? "tutorial-key-active" : "" }`}>
          {arrowSymbols.right}
        </div>
      </div>
    </div>
  );
}

export default TutorialKeyboard;