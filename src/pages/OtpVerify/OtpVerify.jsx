import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { resendOtp, verifyOtp } from "../../api/authApi";
import ButtonSpinner from "../../components/ButtonSpinner";
import "./OtpVerify.css";

export default function OtpVerify({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  function handleChange(index, value) {
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
      await verifyOtp({ email, code });
      onVerified();
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResendLoading(true);
      setResendMessage("");
      setError("");
      await resendOtp({ email });
      setResendMessage("A new code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="otp-page">
      <div className="otp-card">

        {/* Icon */}
        <div className="otp-icon-wrap">
          <ShieldCheck size={30} />
        </div>

        {/* Brand */}
        <div className="otp-brand-row">
          <span className="otp-brand-dot" />
          <span className="otp-brand-label">DevSure Analyzer</span>
        </div>

        <h1>Verify your email</h1>
        <p className="otp-subtitle">
          We sent a 6-digit code to{" "}
          <span className="otp-email-highlight">{email}</span>.
          Enter it below to complete registration.
        </p>

        {error && <div className="otp-alert otp-alert--error">{error}</div>}
        {resendMessage && <div className="otp-alert otp-alert--success">{resendMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`otp-input${digit ? " otp-input--filled" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button type="submit" className="otp-submit" disabled={loading}>
            <ShieldCheck size={17} />
            {loading ? <><ButtonSpinner /> Verifying...</> : "Verify Email"}
          </button>
        </form>

        <div className="otp-footer">
          <p className="otp-resend-text">
            Didn't receive the code?{" "}
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? <><ButtonSpinner /> Sending...</> : "Resend OTP"}
            </button>
          </p>
          <button type="button" className="otp-back-btn" onClick={onBack}>
            ← Back to Register
          </button>
        </div>

      </div>
    </div>
  );
}
