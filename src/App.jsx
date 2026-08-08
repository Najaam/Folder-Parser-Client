import { useState } from "react";
import { AuthProvider } from "./context/AuthProvider";
import useAuth from "./context/useAuth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Auth from "./pages/Auth/Auth";
import OtpVerify from "./pages/OtpVerify/OtpVerify";

function AppContent() {
  const { authLoading, isAuthenticated } = useAuth();
  const [screen, setScreen] = useState("auth");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  if (authLoading) return null;

  if (isAuthenticated) return <Dashboard />;

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

  return (
    <Auth
      successMessage={successMessage}
      onOtpSent={(email) => {
        setPendingEmail(email);
        setScreen("otp");
      }}
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
