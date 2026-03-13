import { useNavigate, NavLink } from "react-router-dom";
import {HomeIcon, LogOutIcon, UserRoundIcon, ChartSplineIcon, Gamepad2Icon} from "lucide-react";
function PrivateLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("logout_success", `You have been logged out.`);
    navigate("/");
  };

  return (
    <div className="app-container">

      <aside className="sidebar">
        <div className="sidebar-top">
          <img
            src="/src/assets/icons/Cognitra.png"
            alt="Logo"
            className="sidebar-logo"
            onClick={() => navigate("/dashboard")}
          />
          <nav className="sidebar-nav">
            <NavLink to="/dashboard"><HomeIcon />Home</NavLink>
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
        {children}
      </main>

    </div>
  );
}

export default PrivateLayout;