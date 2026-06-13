import { Outlet } from "react-router-dom";
import FloatingLines from "@/components/FloatingLines";

function GameLayout() {
  return (
    <main className="game-layout">
      <FloatingLines
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={5}
        lineDistance={5}
        bendRadius={5}
        bendStrength={-0.5}
        interactive
        parallax
      />

      <Outlet />
    </main>
  );
}

export default GameLayout;