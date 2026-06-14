import planeUp from "../Images/Plane-up.png";
import planeDown from "../Images/Plane-down.png";
import planeLeft from "../Images/Plane-left.png";
import planeRight from "../Images/Plane-right.png";

const PLANE_IMAGES = {
  up: planeUp,
  down: planeDown,
  left: planeLeft,
  right: planeRight,
};

function Plane({ x, y, direction, isCenter }) {
  return (
    <img
      src={PLANE_IMAGES[direction]}
      alt={direction}
      className={`plane ${isCenter ? "center-plane" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

export default Plane;