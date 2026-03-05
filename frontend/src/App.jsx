import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

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
        <Route path="*" element={
          <PublicLayout>
            <Home />
          </PublicLayout>
      } />

      </Routes>
  );
}

export default App;