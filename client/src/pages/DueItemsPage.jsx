import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  enableNotifications,
  unregisterNotifications,
} from "../notifications";
import "../DueItemsPage.css";

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

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function DueItemsPage({ mode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    fetchItems();
  }, [mode]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      const data = await apiFetch("/items/overview");
      setItems(data);
    } catch (fetchError) {
      console.error("Failed to fetch due items:", fetchError);
      setError("We couldn't load these items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const turnOnNotifications = async () => {
    setNotificationMessage("");
    const result = await enableNotifications();
    setNotificationMessage(
      result.success ? "Notifications are on." : result.message
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

  const getDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDateOnly = (date) => (date ? date.split("T")[0] : "");

  const parseDateKey = (dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatFriendlyDate = (date) => {
    if (!date) return "";
    const dateKey = getDateOnly(date);
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(todayDate.getDate() + 1);

    if (dateKey === getDateKey(todayDate)) return "Today";
    if (dateKey === getDateKey(tomorrowDate)) return "Tomorrow";

    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(parseDateKey(dateKey));
  };

  const formatRecurrence = (frequency) => {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "fortnightly":
        return "Fortnightly";
      case "monthly":
        return "Monthly";
      default:
        return "";
    }
  };

  const completeItem = async (item) => {
    setActionError("");

    try {
      await apiFetch(`/items/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
      });

      setItems((current) =>
        current.filter((existingItem) => existingItem._id !== item._id)
      );
    } catch (completeError) {
      console.error("Failed to complete item:", completeError);
      setActionError(completeError.message);
    }
  };

  const todayDate = new Date();
  const today = getDateKey(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const tomorrow = getDateKey(tomorrowDate);

  const sundayDate = new Date(todayDate);
  sundayDate.setDate(todayDate.getDate() + ((7 - todayDate.getDay()) % 7));
  const endOfWeek = getDateKey(sundayDate);
  const laterCutoff = endOfWeek > tomorrow ? endOfWeek : tomorrow;

  const overdueItems = items.filter(
    (item) => getDateOnly(item.dueDate) < today
  );
  const todayItems = items.filter(
    (item) => getDateOnly(item.dueDate) === today
  );
  const upcomingItems = items.filter(
    (item) => getDateOnly(item.dueDate) > today
  );

  const tomorrowItems = upcomingItems.filter(
    (item) => getDateOnly(item.dueDate) === tomorrow
  );
  const thisWeekItems = upcomingItems.filter((item) => {
    const dateKey = getDateOnly(item.dueDate);
    return dateKey > tomorrow && dateKey <= endOfWeek;
  });
  const laterItems = upcomingItems.filter(
    (item) => getDateOnly(item.dueDate) > laterCutoff
  );

  const renderOverviewItem = (item, tone = "upcoming") => (
    <article
      className={`upcoming-overview-row ${
        tone === "overdue" ? "is-overdue" : tone === "today" ? "is-today" : ""
      }`}
      key={item._id}
    >
      <button
        type="button"
        className="upcoming-overview-checkbox"
        onClick={() => completeItem(item)}
        aria-label={`Mark ${item.title} complete`}
        title="Mark complete"
      >
        <span aria-hidden="true" />
      </button>

      <div className="upcoming-overview-content">
        {item.listId ? (
          <Link to={`/list/${item.listId._id}`} className="upcoming-task-title">
            {item.title}
          </Link>
        ) : (
          <span className="upcoming-task-title">{item.title}</span>
        )}

        <div className="upcoming-overview-meta">
          {item.listId && (
            <span className="upcoming-list-meta">
              <span aria-hidden="true">
                {item.listId.name?.charAt(0).toUpperCase()}
              </span>
              {item.listId.name}
            </span>
          )}

          {item.assignedTo && (
            <span className="upcoming-assignee-meta">
              <span aria-hidden="true">
                {item.assignedTo.name?.charAt(0).toUpperCase()}
              </span>
              {item.assignedTo.name}
            </span>
          )}

          {item.recurrence?.frequency && (
            <span className="upcoming-repeat-meta">
              ↻ {formatRecurrence(item.recurrence.frequency)}
            </span>
          )}
        </div>
      </div>

      <span className="upcoming-date-badge">
        {formatFriendlyDate(item.dueDate)}
      </span>
    </article>
  );

  const renderGroup = (title, groupItems, tone = "upcoming") => {
    if (groupItems.length === 0) return null;

    return (
      <section
        className={`upcoming-group ${tone === "overdue" ? "today-overdue-group" : ""}`}
      >
        <div className="upcoming-group-heading">
          <div>
            <h2>{title}</h2>
            <span className="upcoming-count">{groupItems.length}</span>
          </div>
        </div>
        <div className="upcoming-notebook-list">
          {groupItems.map((item) => renderOverviewItem(item, tone))}
        </div>
      </section>
    );
  };

  const isTodayMode = mode === "today";
  const pageHasItems = isTodayMode
    ? overdueItems.length + todayItems.length > 0
    : upcomingItems.length > 0;

  return (
    <div className="dashboard-layout concept-one-dashboard upcoming-dashboard">
      <aside className="sidebar concept-one-sidebar upcoming-sidebar">
        <Link to="/" className="upcoming-brand" aria-label="OddsnSods home">
          <img src="/oddsnsods-logo.png" alt="OddsnSods" />
        </Link>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link to="/" className="nav-item">
            <span className="nav-icon upcoming-nav-icon">
              <NavIcon type="lists" />
            </span>
            My Lists
          </Link>
          <Link
            to="/today"
            className={`nav-item ${isTodayMode ? "active" : ""}`}
          >
            <span className="nav-icon upcoming-nav-icon">
              <NavIcon type="today" />
            </span>
            Today
          </Link>
          <Link
            to="/upcoming"
            className={`nav-item ${!isTodayMode ? "active" : ""}`}
          >
            <span className="nav-icon upcoming-nav-icon">
              <NavIcon type="upcoming" />
            </span>
            Upcoming
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-details">
              <strong>{currentUser?.name || "User"}</strong>
              <span>{currentUser?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-secondary-action"
            onClick={turnOnNotifications}
          >
            Notifications
          </button>
          <button
            type="button"
            className="sidebar-secondary-action"
            onClick={logout}
          >
            Log out
          </button>
        </div>

        <button
          type="button"
          className="mobile-profile-trigger"
          aria-label="Open profile and settings"
          aria-expanded={showAccountMenu}
          onClick={() => setShowAccountMenu((current) => !current)}
        >
          {userInitial}
        </button>
      </aside>

      {showAccountMenu && (
        <section className="mobile-account-panel">
          <div className="mobile-account-heading">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-details">
              <strong>{currentUser?.name || "User"}</strong>
              <span>{currentUser?.email}</span>
            </div>
          </div>
          <button type="button" onClick={turnOnNotifications}>
            <span>♢</span>
            Enable notifications
          </button>
          <button type="button" onClick={logout}>
            <span>↗</span>
            Log out
          </button>
          {notificationMessage && <small>{notificationMessage}</small>}
        </section>
      )}

      <main className="dashboard-main upcoming-main">
        <header className="upcoming-header">
          <p className="eyebrow">{isTodayMode ? "TODAY" : "COMING UP"}</p>
          <h1>{isTodayMode ? "Today" : "Upcoming"}</h1>
          <p>
            {isTodayMode
              ? "See what needs your attention today."
              : "See what's coming up across your lists."}
          </p>
        </header>

        {actionError && <div className="auth-error">{actionError}</div>}

        {loading ? (
          <section className="upcoming-empty compact-empty-state">
            <div className="loading-dot" />
            <h2>{isTodayMode ? "Loading today's tasks..." : "Loading what's ahead..."}</h2>
          </section>
        ) : error ? (
          <section className="upcoming-empty">
            <h2>
              {isTodayMode
                ? "Couldn't load today's items"
                : "Couldn't load upcoming items"}
            </h2>
            <p>{error}</p>
            <button type="button" className="primary-button" onClick={fetchItems}>
              Try again
            </button>
          </section>
        ) : !pageHasItems ? (
          <section className="upcoming-empty">
            <div className="upcoming-empty-icon">
              <NavIcon type={isTodayMode ? "today" : "upcoming"} />
            </div>
            <h2>{isTodayMode ? "Nothing due today" : "Nothing coming up"}</h2>
            <p>
              {isTodayMode
                ? "You're clear for now."
                : "Items with future due dates will appear here."}
            </p>
          </section>
        ) : (
          <div className="upcoming-groups">
            {isTodayMode ? (
              <>
                {renderGroup("Overdue", overdueItems, "overdue")}
                {renderGroup("Today", todayItems, "today")}
              </>
            ) : (
              <>
                {renderGroup("Tomorrow", tomorrowItems)}
                {renderGroup("Later this week", thisWeekItems)}
                {renderGroup("Later", laterItems)}
              </>
            )}
          </div>
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link to="/" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon upcoming-mobile-nav-icon">
            <NavIcon type="lists" />
          </span>
          <span>Lists</span>
        </Link>
        <Link
          to="/today"
          className={`mobile-bottom-nav-item ${isTodayMode ? "active" : ""}`}
        >
          <span className="mobile-nav-icon upcoming-mobile-nav-icon">
            <NavIcon type="today" />
          </span>
          <span>Today</span>
        </Link>
        <Link
          to="/upcoming"
          className={`mobile-bottom-nav-item ${!isTodayMode ? "active" : ""}`}
        >
          <span className="mobile-nav-icon upcoming-mobile-nav-icon">
            <NavIcon type="upcoming" />
          </span>
          <span>Upcoming</span>
        </Link>
        <Link to="/profile" className="mobile-bottom-nav-item">
          <span className="mobile-nav-avatar">{userInitial}</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

export default DueItemsPage;
