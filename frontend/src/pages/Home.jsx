import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="home-container">
      <h1>Welcome back{user ? `, ${user.name}` : ""}</h1>
    </div>
  );
}

export default Home;