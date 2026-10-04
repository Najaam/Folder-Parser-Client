import { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { resetPassword } from "../../api/authApi";
import ButtonSpinner from "../../components/ButtonSpinner";
import "./ResetPassword.css";

export default function ResetPassword({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword({ email, code, newPassword });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      if (err.message?.includes("OTP") || err.message?.includes("Incorrect")) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rp-page">
      <div className="rp-card">

        <div className="rp-icon-wrap">
          <ShieldCheck size={28} />
        </div>

        <div className="rp-brand-row">
          <span className="rp-brand-dot" />
          <span className="rp-brand-label">DevSure Analyzer</span>
        </div>

        <h1>Reset password</h1>
        <p className="rp-subtitle">
          Enter the 6-digit code sent to{" "}
          <span className="rp-email">{email}</span>{" "}
          and choose a new password.
        </p>

        {error && <div className="rp-alert rp-alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div className="rp-otp-row" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`rp-otp-input${digit ? " rp-otp-input--filled" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* New password */}
          <div className="rp-field">
            <label htmlFor="rp-password">New Password</label>
            <div className="rp-pass-wrap">
              <input
                id="rp-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="rp-eye"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="rp-submit" disabled={loading}>
            <ShieldCheck size={16} />
            {loading ? <><ButtonSpinner /> Resetting...</> : "Reset Password"}
          </button>
        </form>

        <button type="button" className="rp-back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </button>
      </div>
    </div>
  );
}
