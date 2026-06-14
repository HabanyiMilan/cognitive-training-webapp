import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import PrivateLayout from "./components/PrivateLayout";
import GameLayout from "./components/GameLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Assessment from "./pages/Assessment";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";
import Games from "./pages/Games"
import CardMatch from "./Games/CardMatch/CardMatch";
import LogicShift from "./Games/LogicShift/LogicShift";
import AttentionFlight from "./Games/AttentionFlight/AttentionFlight";
import Statistics from "./pages/Statistics";

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
          <Route path="statistics" element={<Statistics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route element={
            <ProtectedRoute>
              <GameLayout />
            </ProtectedRoute>
        }>
          <Route path="games/card-match" element={<CardMatch />} />
          <Route path="games/attention-flight" element={<AttentionFlight />} />
          <Route path="games/logic-shift" element={<LogicShift />} />
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
