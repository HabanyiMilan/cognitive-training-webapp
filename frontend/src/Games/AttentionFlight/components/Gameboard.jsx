import Plane from "./Plane";
import "@/Games/AttentionFlight/AttentionFlight.css";

function GameBoard({ planes }) {
  return (
    <div className="gameboard">
      <div className="radar-sweep" />
      {planes.map((plane) => (
        <Plane
          key={plane.id}
          x={plane.x}
          y={plane.y}
          direction={plane.direction}
          isTarget={plane.isTarget}
        />
      ))}
    </div>
  );
}

export default GameBoard;