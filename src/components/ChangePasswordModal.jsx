import { useState } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { changePassword } from "../api/authApi";
import useAuth from "../context/useAuth";
import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ onClose }) {
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await changePassword(formData);
      setSuccess(data.message);

      // Password changed — all sessions revoked on backend, logout frontend too
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>Change Password</h2>
            <p>Enter your current password to set a new one.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success} Logging out...</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Current Password
            <div className="password-input-wrapper">
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            New Password
            <div className="password-input-wrapper">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              <KeyRound size={17} />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
