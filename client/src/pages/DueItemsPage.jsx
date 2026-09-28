import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { apiFetch } from "../api";
import {
  unregisterNotifications,
} from "../notifications";

function DueItemsPage({ mode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [actionError, setActionError] =
    useState("");

  const navigate = useNavigate();

  const storedUser =
    localStorage.getItem("user");

  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  useEffect(() => {
    fetchItems();
  }, [mode]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");

      const data = await apiFetch(
        "/items/overview"
      );

      setItems(data);
    } catch (error) {
      console.error(
        "Failed to fetch due items:",
        error
      );

      setError(
        "We couldn't load these items. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const result =
      await unregisterNotifications();

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

  const getTodayString = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getDateOnly = (date) => {
    if (!date) return "";

    return date.split("T")[0];
  };

  const formatDueDate = (date) => {
    if (!date) return "";

    const [year, month, day] =
      getDateOnly(date).split("-");

    return `${day}/${month}/${year}`;
  };

  const formatRecurrence = (
    frequency
  ) => {
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
      await apiFetch(
        `/items/${item._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            completed: true,
          }),
        }
      );

      setItems((current) =>
        current.filter(
          (existingItem) =>
            existingItem._id !== item._id
        )
      );
    } catch (error) {
      console.error(
        "Failed to complete item:",
        error
      );

      setActionError(error.message);
    }
  };

  const today = getTodayString();

  const overdueItems = items.filter(
    (item) =>
      getDateOnly(item.dueDate) <
      today
  );

  const todayItems = items.filter(
    (item) =>
      getDateOnly(item.dueDate) ===
      today
  );

  const upcomingItems = items.filter(
    (item) =>
      getDateOnly(item.dueDate) >
      today
  );

  const renderItem = (item) => (
    <article
      className="overview-task-card"
      key={item._id}
    >
      <button
        type="button"
        className="overview-checkbox"
        onClick={() =>
          completeItem(item)
        }
        title="Mark complete"
      >
        ✓
      </button>

      <div className="overview-task-content">
        <h3>{item.title}</h3>

        <div className="overview-task-meta">
          {item.listId && (
            <Link
              to={`/list/${item.listId._id}`}
              className="overview-list-link"
            >
              {item.listId.name}
            </Link>
          )}

          {item.assignedTo && (
            <span>
              {item.assignedTo.name}
            </span>
          )}

          <span className="due-date-pill">
            {formatDueDate(
              item.dueDate
            )}
          </span>

          {item.recurrence
            ?.frequency && (
            <span className="recurrence-pill">
              ↻{" "}
              {formatRecurrence(
                item.recurrence
                  .frequency
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            O
          </div>

          <span>OddsnSods</span>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className="nav-item"
          >
            <span>☰</span>
            My Lists
          </Link>

          <Link
            to="/today"
            className={`nav-item ${
              mode === "today"
                ? "active"
                : ""
            }`}
          >
            <span>○</span>
            Today
          </Link>

          <Link
            to="/upcoming"
            className={`nav-item ${
              mode === "upcoming"
                ? "active"
                : ""
            }`}
          >
            <span>◷</span>
            Upcoming
          </Link>

          <button className="nav-item disabled">
            <span>✓</span>
            Completed
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">
              {currentUser?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="user-details">
              <strong>
                {currentUser?.name}
              </strong>

              <span>
                {currentUser?.email}
              </span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="overview-header">
          <p className="eyebrow">
            {mode === "today"
              ? "TODAY"
              : "COMING UP"}
          </p>

          <h1>
            {mode === "today"
              ? "Today"
              : "Upcoming"}
          </h1>

          <p>
            {mode === "today"
              ? "Items that need attention now."
              : "See what's coming up across your lists."}
          </p>
        </header>

        {actionError && (
          <div className="auth-error">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="overview-empty">
            Loading...
          </div>
        ) : error ? (
          <div className="overview-empty">
            <h3>Couldn't load these items</h3>

            <p>{error}</p>

            <button
              type="button"
              className="primary-button"
              onClick={fetchItems}
            >
              Try again
            </button>
          </div>
        ) : mode === "today" ? (
          <>
            {overdueItems.length >
              0 && (
              <section className="overview-section">
                <div className="overview-section-heading">
                  <h2 className="overdue-heading">
                    Overdue
                  </h2>

                  <span>
                    {
                      overdueItems.length
                    }
                  </span>
                </div>

                <div className="overview-task-list">
                  {overdueItems.map(
                    renderItem
                  )}
                </div>
              </section>
            )}

            <section className="overview-section">
              <div className="overview-section-heading">
                <h2>Today</h2>

                <span>
                  {todayItems.length}
                </span>
              </div>

              {todayItems.length >
              0 ? (
                <div className="overview-task-list">
                  {todayItems.map(
                    renderItem
                  )}
                </div>
              ) : (
                <div className="overview-empty">
                  <div className="overview-empty-icon">
                    ✓
                  </div>

                  <h3>
                    Nothing due today
                  </h3>

                  <p>
                    You're clear for now.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="overview-section">
            <div className="overview-section-heading">
              <h2>Coming up</h2>

              <span>
                {upcomingItems.length}
              </span>
            </div>

            {upcomingItems.length >
            0 ? (
              <div className="overview-task-list">
                {upcomingItems.map(
                  renderItem
                )}
              </div>
            ) : (
              <div className="overview-empty">
                <div className="overview-empty-icon">
                  ◷
                </div>

                <h3>
                  Nothing coming up
                </h3>

                <p>
                  Items with future due
                  dates will appear here.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default DueItemsPage;
