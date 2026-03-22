import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Assessment from "./pages/Assessment";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";
import Games from "./pages/Games"
import CardMatch from "./Games/CardMatch/CardMatch";

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
        <Route element={
          <ProtectedRoute>
            <PrivateLayout />
          </ProtectedRoute>
        }>
          <Route path="home" element={<Home />} />
          <Route path="games" element={<Games />} />
          <Route path="games/card-match" element={<CardMatch />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
      } />

      </Routes>
  );
}

export default App;
