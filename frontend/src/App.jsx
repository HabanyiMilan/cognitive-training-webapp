import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Profile from "./pages/Profile";

function App() {
  return (
      <Routes>
        <Route path="/" element={
          <PublicLayout>
            <Home />
          </PublicLayout>
          } />
          <Route path="/assessment" element={
              <PublicLayout>
                <Assessment />
              </PublicLayout>
          } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PrivateLayout>
              <Dashboard />
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
            <Home />
          </PublicLayout>
      } />

      </Routes>
  );
}

export default App;
