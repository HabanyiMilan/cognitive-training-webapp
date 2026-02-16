import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  return (
      <Routes>
        <Route path="/" element={
          <PublicLayout>
            <Login />
          </PublicLayout>
          } />
        <Route path="/home" element={
          <ProtectedRoute>
            <PrivateLayout>
              <Home />
            </PrivateLayout>
          </ProtectedRoute>
        } />
      </Routes>
  );
}

export default App;