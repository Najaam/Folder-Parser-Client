import { useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { sendOtp } from "../../api/authApi";
import useAuth from "../../context/useAuth";
import ButtonSpinner from "../../components/ButtonSpinner";
import "./Auth.css";

export default function Auth({ onOtpSent, onForgotPassword, successMessage, onBackToLanding }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "", rememberMe: false });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regData, setRegData] = useState({ name: "", email: "", password: "" });
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError("");
      await login(loginData);
    } catch (err) {
      setLoginError(err.message || "Invalid email or password");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    // Frontend validation — passwords must match
    if (regData.password !== confirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }

    try {
      setRegLoading(true);
      setRegError("");
      await sendOtp(regData);
      onOtpSent(regData.email);
    } catch (err) {
      setRegError(err.message || "Unable to send OTP. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isRegister ? "is-register" : ""}`}>

        {/* ── Login Form — left side ── */}
        <div className="auth-left-side">
          <div className="auth-form-inner">
            <div className="auth-brand-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="auth-brand-dot" />
                <span className="auth-brand-label">DevSure Analyzer</span>
              </div>
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "6px"
                  }}
                >
                  ← Home
                </button>
              )}
            </div>
            <h1>Sign In</h1>
            <p className="auth-form-sub">Enter your credentials to continue.</p>

            {successMessage && (
              <div className="auth-alert auth-alert--success">{successMessage}</div>
            )}
            {loginError && (
              <div className="auth-alert auth-alert--error">{loginError}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-pass-wrap">
                  <input
                    type={showLoginPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowLoginPass((v) => !v)}
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    className="auth-remember-check"
                    checked={loginData.rememberMe}
                    onChange={(e) =>
                      setLoginData((p) => ({ ...p, rememberMe: e.target.checked }))
                    }
                  />
                  <span>Remember me for 3 days</span>
                </label>
                <button type="button" className="auth-forgot-btn" onClick={onForgotPassword}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit" disabled={loginLoading}>
                {loginLoading ? <><ButtonSpinner /> Signing in...</> : "Sign In"}
              </button>
            </form>

            <p className="auth-switch-mobile">
              No account?{" "}
              <button type="button" onClick={() => setIsRegister(true)}>
                Create one
              </button>
            </p>
          </div>
        </div>

        {/* ── Register Form — right side ── */}
        <div className="auth-right-side">
          <div className="auth-form-inner">
            <div className="auth-brand-row">
              <span className="auth-brand-dot" />
              <span className="auth-brand-label">DevSure Analyzer</span>
            </div>
            <h1>Create Account</h1>
            <p className="auth-form-sub">Fill in your details to get started.</p>

            {regError && (
              <div className="auth-alert auth-alert--error">{regError}</div>
            )}

            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={regData.name}
                  onChange={(e) => setRegData((p) => ({ ...p, name: e.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={regData.email}
                  onChange={(e) => setRegData((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-pass-wrap">
                  <input
                    type={showRegPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    minLength={6}
                    value={regData.password}
                    onChange={(e) => setRegData((p) => ({ ...p, password: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowRegPass((v) => !v)}
                  >
                    {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="auth-pass-wrap">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Re-enter your password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowConfirmPass((v) => !v)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={regLoading}>
                {regLoading ? <><ButtonSpinner /> Sending OTP...</> : "Continue"}
              </button>
            </form>

            <p className="auth-switch-mobile">
              Already registered?{" "}
              <button type="button" onClick={() => setIsRegister(false)}>
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* ── Sliding overlay panel ── */}
        <div className="auth-overlay">
          <div className="auth-overlay-blob" />
          <div className="auth-overlay-blob" />

          {/* Shown on register screen — "already have account?" */}
          <div className="auth-overlay-panel auth-overlay-left">
            <h2>Welcome Back!</h2>
            <p>Already have an account? Sign in to access your workspace.</p>
            <button className="auth-ghost-btn" onClick={() => setIsRegister(false)}>
              <LogIn size={16} />
              Sign In
            </button>
          </div>

          {/* Shown on login screen — "no account?" */}
          <div className="auth-overlay-panel auth-overlay-right">
            <h2>Hello, Developer!</h2>
            <p>New to DevSure? Create an account and start analyzing your projects.</p>
            <button className="auth-ghost-btn" onClick={() => setIsRegister(true)}>
              <UserPlus size={16} />
              Create Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
