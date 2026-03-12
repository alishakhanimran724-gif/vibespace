import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { loadUser } from "./redux/reducers/authSlice";
import { getUnreadCount } from "./redux/reducers/notificationSlice";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import SellerDashboard from "./pages/SellerDashboard";
import Reels from "./pages/Reels";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import EditProfile from "./pages/EditProfile";
import Analytics from "./pages/Analytics";
import AICaption from "./pages/AICaption";
import MyOrders from "./pages/MyOrders";

// Layout
import Navbar from "./components/layout/Navbar";
import MobileNavbar from "./components/layout/MobileNavbar";

import "./index.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((s) => s.auth);
  if (loading) return <div className="loader" />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((s) => s.auth);
  if (loading) return <div className="loader" />;
  return isAuthenticated ? children : <Navigate to="/register" />;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((s) => s.auth);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("darkMode") === "true"; } catch { return false; }
  });

  useEffect(() => { dispatch(loadUser()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) dispatch(getUnreadCount());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try { localStorage.setItem("darkMode", darkMode); } catch {}
  }, [darkMode]);

  if (loading) return <div className="loader" />;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Desktop top navbar */}
      <NavbarWrapper darkMode={darkMode} toggleDark={() => setDarkMode(!darkMode)} />

      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding */}
        <Route path="/welcome" element={
          <OnboardingRoute><Onboarding /></OnboardingRoute>
        } />

        {/* Protected */}
        <Route path="/"                element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/edit-profile"    element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/chat"            element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/marketplace"     element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/reels"           element={<ProtectedRoute><Reels /></ProtectedRoute>} />
        <Route path="/notifications"   element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/search"          element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/explore"         element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/analytics"       element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai-caption"      element={<ProtectedRoute><AICaption /></ProtectedRoute>} />
        <Route path="/my-orders"       element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="*"                element={<Navigate to="/" />} />
      </Routes>

      {/* Mobile bottom navbar */}
      <MobileNavbarWrapper />
    </Router>
  );
}

/* ── Desktop navbar — hide on auth/onboarding pages ── */
const NavbarWrapper = ({ darkMode, toggleDark }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const location = useLocation();
  const hideOn = ["/login", "/register", "/welcome"];
  if (!isAuthenticated || hideOn.includes(location.pathname)) return null;
  return <Navbar darkMode={darkMode} toggleDark={toggleDark} />;
};

/* ── Mobile bottom navbar — same hide logic ── */
const MobileNavbarWrapper = () => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const location = useLocation();
  const hideOn = ["/login", "/register", "/welcome"];
  if (!isAuthenticated || hideOn.includes(location.pathname)) return null;
  return <MobileNavbar />;
};

export default App;