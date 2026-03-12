import { useNavigate, NavLink } from "react-router-dom";
import { HomeIcon, ChartBarIcon, UserCircleIcon, ArrowRightStartOnRectangleIcon, FireIcon } from '@heroicons/react/24/outline';

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
            <NavLink to="/games"><FireIcon />Games</NavLink>
            <NavLink to="/statistics"><ChartBarIcon />Statistics</NavLink>
            <NavLink to="/profile"><UserCircleIcon />Profile</NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="logout-btn">
           <ArrowRightStartOnRectangleIcon /> Logout
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