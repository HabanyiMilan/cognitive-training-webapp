import { useMemo } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { LogOutIcon } from "lucide-react";
import Wallpaper from "../assets/images/Home.png";
import { motion } from "framer-motion";

function PrivateLayout({ children }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", path: "/home" },
    { label: "Games", path: "/games" },
    { label: "Statistics", path: "/statistics" },
    { label: "Profile", path: "/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("logout_success", `You have been logged out.`);
    navigate("/");
  };

  const wallpaper = useMemo(() => (
    <div className="wallpaper-bg">
      <img
          src={Wallpaper}
          alt="Wallpaper"
          className="wallpaper-image"
        />
    </div>
  ), []);

  return (
    <div className="app-container">
      <header className="navbar">

        <img
          src="/src/assets/icons/Cognitra.png"
          alt="Logo"
          className="navbar-logo"
        />

        <nav className="navbar-links">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div className="nav-item">
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="active-pill"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <span>{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <LogOutIcon /> Logout
        </button>
      </header>

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
