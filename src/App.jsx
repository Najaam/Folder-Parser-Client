import { useState } from "react";
import { AuthProvider } from "./context/AuthProvider";
import useAuth from "./context/useAuth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Auth from "./pages/Auth/Auth";
import OtpVerify from "./pages/OtpVerify/OtpVerify";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import LandingPage from "./pages/LandingPage";

function AppContent() {
  const { authLoading, isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("landing");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  if (authLoading) return null;
  if (isAuthenticated) return <Dashboard />;

  if (screen === "landing") {
    return (
      <LandingPage
        onGetStarted={() => {
          setSuccessMessage("");
          setScreen("auth");
        }}
        onLogin={() => {
          setSuccessMessage("");
          setScreen("auth");
        }}
      />
    );
  }

  // ── Register OTP verify
  if (screen === "otp") {
    return (
      <OtpVerify
        email={pendingEmail}
        onVerified={() => {
          setSuccessMessage("Email verified! Your account is ready. Please sign in.");
          setScreen("auth");
        }}
        onBack={() => setScreen("auth")}
      />
    );
  }

  // ── Forgot password — email input
  if (screen === "forgot") {
    return (
      <ForgotPassword
        onOtpSent={(email) => {
          setPendingEmail(email);
          setScreen("reset");
        }}
        onBack={() => setScreen("auth")}
      />
    );
  }

  // ── Reset password — OTP + new password
  if (screen === "reset") {
    return (
      <ResetPassword
        email={pendingEmail}
        onSuccess={() => {
          setSuccessMessage("Password reset successfully! Please sign in.");
          setScreen("auth");
        }}
        onBack={() => setScreen("forgot")}
      />
    );
  }

  // ── Auth (login + register sliding panel)
  return (
    <Auth
      successMessage={successMessage}
      onOtpSent={(email) => {
        setPendingEmail(email);
        setScreen("otp");
      }}
      onForgotPassword={() => {
        setSuccessMessage("");
        setScreen("forgot");
      }}
      onBackToLanding={() => setScreen("landing")}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
