import { LogOut } from "lucide-react";
import useAuth from "../../context/useAuth";
import FolderParser from "../FolderParser";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <main className="dashboard-page">
      <header className="dashboard-bar">
        {/* User info */}
        <div className="dashboard-user">
          <div className="dashboard-avatar">{initials}</div>
          <div className="dashboard-user-info">
            <h1 className="dashboard-name">{user?.name || "DevSure User"}</h1>
            <p className="dashboard-email">{user?.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="dashboard-actions">
          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={logout}
            title="Logout"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <FolderParser />
    </main>
  );
}
