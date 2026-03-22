import { useMemo } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import FloatingLines from "@/components/FloatingLines";
import {HomeIcon, LogOutIcon, UserRoundIcon, ChartSplineIcon, Gamepad2Icon} from "lucide-react";

function PrivateLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("logout_success", `You have been logged out.`);
    navigate("/");
  };

  const wallpaper = useMemo(() => (
    <div className="wallpaper-bg">
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
  ), []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-top">
          <img
            src="/src/assets/icons/Cognitra.png"
            alt="Logo"
            className="sidebar-logo"
            onClick={() => navigate("/home")}
          />
          <nav className="sidebar-nav">
            <NavLink to="/home"><HomeIcon />Home</NavLink>
            <NavLink to="/games"><Gamepad2Icon />Games</NavLink>
            <NavLink to="/statistics"><ChartSplineIcon />Statistics</NavLink>
            <NavLink to="/profile"><UserRoundIcon />Profile</NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="logout-btn">
           <LogOutIcon /> Logout
          </button>
        </div>
      </aside>

      <main className="app-content">
        {wallpaper}
        <div className="wallpaper-wrapper">
          <div className="wallpaper-content">
            {children ?? <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default PrivateLayout;
