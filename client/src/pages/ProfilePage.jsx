import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  enableNotifications,
  unregisterNotifications,
} from "../notifications";
import "../ProfilePage.css";

function NavIcon({ type }) {
  if (type === "lists") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6h10M9 12h10M9 18h10" />
        <path d="M5 6h.01M5 12h.01M5 18h.01" />
      </svg>
    );
  }

  if (type === "today") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 9h16" />
        <path d="M8 13h3v3H8z" />
      </svg>
    );
  }

  if (type === "upcoming") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

const getNotificationPermission = () => {
  if (typeof Notification === "undefined") return "unavailable";
  return Notification.permission;
};

function ProfilePage() {
  const navigate = useNavigate();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    getNotificationPermission
  );

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "U";

  const turnOnNotifications = async () => {
    setNotificationMessage("");
    const result = await enableNotifications();
    setNotificationPermission(getNotificationPermission());
    setNotificationMessage(
      result.success ? "Notifications are ready on this browser." : result.message
    );
  };

  const logout = async () => {
    const result = await unregisterNotifications();

    if (!result.success) {
      console.warn(
        "Could not unregister notifications before logout:",
        result.message
      );
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const notificationStatus = (() => {
    if (notificationPermission === "granted") {
      return { label: "Allowed", className: "on" };
    }

    if (notificationPermission === "denied") {
      return { label: "Blocked", className: "blocked" };
    }

    if (notificationPermission === "unavailable") {
      return { label: "Unavailable", className: "off" };
    }

    return { label: "Not enabled", className: "off" };
  })();

  return (
    <div className="dashboard-layout concept-one-dashboard profile-dashboard">
      <aside className="sidebar concept-one-sidebar profile-sidebar">
        <Link to="/" className="profile-brand" aria-label="OddsnSods home">
          <img src="/oddsnsods-logo.png" alt="OddsnSods" />
        </Link>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link to="/" className="nav-item">
            <span className="nav-icon profile-nav-icon">
              <NavIcon type="lists" />
            </span>
            My Lists
          </Link>
          <Link to="/today" className="nav-item">
            <span className="nav-icon profile-nav-icon">
              <NavIcon type="today" />
            </span>
            Today
          </Link>
          <Link to="/upcoming" className="nav-item">
            <span className="nav-icon profile-nav-icon">
              <NavIcon type="upcoming" />
            </span>
            Upcoming
          </Link>
          <Link to="/profile" className="nav-item active">
            <span className="nav-icon profile-nav-icon">
              <NavIcon type="profile" />
            </span>
            Profile
          </Link>
        </nav>

        <div className="sidebar-bottom profile-sidebar-bottom">
          <button
            type="button"
            className="sidebar-secondary-action"
            onClick={logout}
          >
            <span>↗</span>
            Log out
          </button>
        </div>

        <div className="mobile-profile-trigger profile-current-avatar" aria-hidden="true">
          {userInitial}
        </div>
      </aside>

      <main className="dashboard-main profile-main">
        <header className="profile-header">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>Profile</h1>
          <p>Your account and app settings, all in one place.</p>
        </header>

        <section className="profile-section" aria-labelledby="account-heading">
          <div className="profile-section-heading">
            <div>
              <h2 id="account-heading">Account</h2>
              <p>The details connected to this OddsnSods account.</p>
            </div>
          </div>

          <div className="profile-account-card">
            <div className="profile-large-avatar">{userInitial}</div>
            <div className="profile-account-copy">
              <strong>{currentUser?.name || "User"}</strong>
              <span>{currentUser?.email || "No email saved"}</span>
            </div>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="notifications-heading">
          <div className="profile-section-heading">
            <div>
              <h2 id="notifications-heading">Notifications</h2>
              <p>Get assignment and due-date reminders on this browser.</p>
            </div>
            <span className={`profile-status-pill ${notificationStatus.className}`}>
              {notificationStatus.label}
            </span>
          </div>

          <div className="profile-setting-row">
            <div className="profile-setting-icon" aria-hidden="true">♢</div>
            <div className="profile-setting-copy">
              <strong>Browser notifications</strong>
              <span>
                OddsnSods can remind you when something is assigned to you or due.
              </span>
            </div>
            <button
              type="button"
              className="profile-setting-button"
              onClick={turnOnNotifications}
              disabled={notificationPermission === "unavailable"}
            >
              {notificationPermission === "granted" ? "Refresh" : "Enable"}
            </button>
          </div>

          {notificationPermission === "denied" && (
            <p className="profile-help-text">
              Notifications are blocked in your browser settings. Allow them there,
              then come back and tap Enable.
            </p>
          )}

          {notificationMessage && (
            <p className="profile-feedback">{notificationMessage}</p>
          )}
        </section>

        <section className="profile-section profile-session-section" aria-labelledby="session-heading">
          <div className="profile-section-heading">
            <div>
              <h2 id="session-heading">Session</h2>
              <p>Sign out of OddsnSods on this device.</p>
            </div>
          </div>

          <button type="button" className="profile-logout-button" onClick={logout}>
            Log out
          </button>
        </section>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link to="/" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon profile-mobile-nav-icon">
            <NavIcon type="lists" />
          </span>
          <span>Lists</span>
        </Link>
        <Link to="/today" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon profile-mobile-nav-icon">
            <NavIcon type="today" />
          </span>
          <span>Today</span>
        </Link>
        <Link to="/upcoming" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon profile-mobile-nav-icon">
            <NavIcon type="upcoming" />
          </span>
          <span>Upcoming</span>
        </Link>
        <Link to="/profile" className="mobile-bottom-nav-item active">
          <span className="mobile-nav-avatar">{userInitial}</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

export default ProfilePage;
