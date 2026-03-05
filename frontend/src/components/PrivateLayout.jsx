import { useNavigate, NavLink } from "react-router-dom";

function PrivateLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
            <NavLink to="/dashboard">Home</NavLink>
            <NavLink to="/tasks">Tasks</NavLink>
            <NavLink to="/statistics">Statistics</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="logout-btn">
            Logout
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