import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Assessment from "./pages/Assessment";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";

function App() {
  return (
      <Routes>
        <Route path="/" element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
          } />
          <Route path="/assessment" element={
              <PublicLayout>
                <Assessment />
              </PublicLayout>
          } />
        <Route path="/home" element={
          <ProtectedRoute>
            <PrivateLayout>
              <Home />
            </PrivateLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PrivateLayout>
              <Profile />
            </PrivateLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
      } />

      </Routes>
  );
}

export default App;
