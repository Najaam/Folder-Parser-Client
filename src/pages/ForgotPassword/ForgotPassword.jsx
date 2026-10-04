import { useState } from "react";
import { ArrowLeft, KeyRound, Send } from "lucide-react";
import { forgotPassword } from "../../api/authApi";
import ButtonSpinner from "../../components/ButtonSpinner";
import "./ForgotPassword.css";

export default function ForgotPassword({ onOtpSent, onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await forgotPassword({ email });
      onOtpSent(email);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-card">

        <div className="fp-icon-wrap">
          <KeyRound size={28} />
        </div>

        <div className="fp-brand-row">
          <span className="fp-brand-dot" />
          <span className="fp-brand-label">DevSure Analyzer</span>
        </div>

        <h1>Forgot password?</h1>
        <p className="fp-subtitle">
          Enter your registered email address and we'll send you a reset code.
        </p>

        {error && <div className="fp-alert fp-alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="fp-field">
            <label htmlFor="fp-email">Email address</label>
            <input
              id="fp-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" className="fp-submit" disabled={loading}>
            <Send size={16} />
            {loading ? <><ButtonSpinner /> Sending...</> : "Send Reset Code"}
          </button>
        </form>

        <button type="button" className="fp-back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
