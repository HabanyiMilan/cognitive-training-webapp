import { useNavigate } from "react-router-dom";

function PrivateLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div>
      <nav style={{ 
        width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "#111",
          padding: "15px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
      }}>
        <div onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
          Cognitive Training
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main style={{ padding: "40px" }}>
        {children}
      </main>
    </div>
  );
}

export default PrivateLayout;
