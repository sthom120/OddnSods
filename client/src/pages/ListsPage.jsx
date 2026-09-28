import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  enableNotifications,
  syncNotificationsIfAllowed,
  unregisterNotifications,
} from "../notifications";
import "../MyListsPolish.css";

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
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

function ListsPage() {
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listsError, setListsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [notificationMessage, setNotificationMessage] =
    useState("");
  const [openMenuListId, setOpenMenuListId] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const userInitial =
    currentUser?.name?.charAt(0).toUpperCase() || "U";

  const turnOnNotifications = async () => {
    setNotificationMessage("");

    const result = await enableNotifications();

    if (result.success) {
      setNotificationMessage("Notifications are on.");
    } else {
      setNotificationMessage(result.message);
    }
  };

  useEffect(() => {
    fetchLists();
    syncNotificationsIfAllowed();
  }, []);

  const fetchLists = async () => {
    setLoadingLists(true);
    setListsError("");

    try {
      const data = await apiFetch("/lists");
      setLists(data);
    } catch (error) {
      console.error("Failed to fetch lists:", error);

      setListsError(
        "We couldn't load your lists. Please try again."
      );
    } finally {
      setLoadingLists(false);
    }
  };

  const openCreateList = () => {
    setActionError("");
    setShowNewListForm(true);
    setOpenMenuListId(null);
  };

  const createList = async (e) => {
    e.preventDefault();

    if (!newListName.trim()) return;

    setActionError("");

    try {
      const newList = await apiFetch("/lists", {
        method: "POST",
        body: JSON.stringify({
          name: newListName,
        }),
      });

      setLists((current) => [newList, ...current]);
      setNewListName("");
      setShowNewListForm(false);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const startEditing = (list) => {
    setActionError("");
    setOpenMenuListId(null);
    setEditingListId(list._id);
    setEditingName(list.name);
  };

  const saveListName = async (listId) => {
    if (!editingName.trim()) return;

    setActionError("");

    try {
      const updatedList = await apiFetch(`/lists/${listId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingName,
        }),
      });

      setLists((current) =>
        current.map((list) =>
          list._id === updatedList._id ? updatedList : list
        )
      );

      setEditingListId(null);
      setEditingName("");
    } catch (error) {
      setActionError(error.message);
    }
  };

  const deleteList = async (listId) => {
    setOpenMenuListId(null);

    const confirmed = window.confirm(
      "Are you sure you want to delete this list?"
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await apiFetch(`/lists/${listId}`, {
        method: "DELETE",
      });

      setLists((current) =>
        current.filter((list) => list._id !== listId)
      );
    } catch (error) {
      setActionError(error.message);
    }
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

  const getListColourClass = (index) => {
    const colours = [
      "list-card-purple",
      "list-card-blue",
      "list-card-peach",
      "list-card-green",
      "list-card-pink",
    ];

    return colours[index % colours.length];
  };

  return (
    <div className="dashboard-layout concept-one-dashboard">
      <aside className="sidebar concept-one-sidebar">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <span>OddsnSods</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link to="/" className="nav-item active">
            <span className="nav-icon polished-nav-icon">
              <NavIcon type="lists" />
            </span>
            My Lists
          </Link>

          <Link to="/today" className="nav-item">
            <span className="nav-icon polished-nav-icon">
              <NavIcon type="today" />
            </span>
            Today
          </Link>

          <Link to="/upcoming" className="nav-item">
            <span className="nav-icon polished-nav-icon">
              <NavIcon type="upcoming" />
            </span>
            Upcoming
          </Link>

          <button className="nav-item disabled" type="button">
            <span className="nav-icon polished-nav-icon">
              <NavIcon type="completed" />
            </span>
            Completed
          </button>
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
            <span>♢</span>
            Notifications
          </button>

          <button
            className="sidebar-secondary-action"
            type="button"
            onClick={logout}
          >
            <span>↗</span>
            Log out
          </button>

          {notificationMessage && (
            <small className="notification-setting-message">
              {notificationMessage}
            </small>
          )}
        </div>

        <button
          type="button"
          className="mobile-profile-trigger"
          aria-label="Open profile and settings"
          aria-expanded={showAccountMenu}
          onClick={() =>
            setShowAccountMenu((current) => !current)
          }
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

          {notificationMessage && (
            <small>{notificationMessage}</small>
          )}
        </section>
      )}

      <main className="dashboard-main concept-one-main">
        <header className="dashboard-header concept-one-header">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>My Lists</h1>
            <p className="dashboard-subtitle">
              Keep everything somewhere other than your head.
            </p>
          </div>

          <button
            className="primary-button new-list-button"
            type="button"
            onClick={openCreateList}
          >
            <span className="button-plus">+</span>
            New list
          </button>
        </header>

        {actionError && (
          <div className="auth-error dashboard-error">
            {actionError}
          </div>
        )}

        {showNewListForm && (
          <section className="new-list-panel concept-one-new-list-panel">
            <div>
              <p className="panel-kicker">NEW LIST</p>
              <h2>What do you want to get out of your head?</h2>
              <p>
                Just give it a name for now. You can change the details later.
              </p>
            </div>

            <form className="new-list-form" onSubmit={createList}>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Home, Uni, Holiday planning..."
                aria-label="New list name"
              />

              <button className="primary-button" type="submit">
                Create
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowNewListForm(false);
                  setNewListName("");
                  setActionError("");
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {loadingLists ? (
          <section className="empty-state compact-empty-state">
            <div className="loading-dot" />
            <h2>Loading your lists...</h2>
          </section>
        ) : listsError ? (
          <section className="empty-state">
            <h2>Couldn't load your lists</h2>
            <p>{listsError}</p>
            <button
              className="primary-button"
              type="button"
              onClick={fetchLists}
            >
              Try again
            </button>
          </section>
        ) : lists.length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon">✓</div>
            <h2>Nothing to hold onto yet</h2>
            <p>Create a list and get it out of your head.</p>
            <button
              className="primary-button"
              type="button"
              onClick={openCreateList}
            >
              Create your first list
            </button>
          </section>
        ) : (
          <section className="lists-grid concept-one-lists-grid">
            {lists.map((list, index) => {
              const userOwnsList =
                list.owner?._id === currentUser?.id ||
                list.owner === currentUser?.id;

              const isShared = list.members?.length > 0;
              const sharedLabel = `Shared with ${
                list.members?.length || 0
              } ${list.members?.length === 1 ? "person" : "people"}`;

              return (
                <article
                  className={`dashboard-list-card concept-one-list-card polished-list-card ${getListColourClass(
                    index
                  )}`}
                  key={list._id}
                >
                  {editingListId === list._id && userOwnsList ? (
                    <div className="list-edit-panel">
                      <label>
                        <span>List name</span>
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) =>
                            setEditingName(e.target.value)
                          }
                        />
                      </label>

                      <div className="card-actions">
                        <button
                          className="small-button primary-small"
                          type="button"
                          onClick={() => saveListName(list._id)}
                        >
                          Save
                        </button>

                        <button
                          className="small-button"
                          type="button"
                          onClick={() => {
                            setEditingListId(null);
                            setEditingName("");
                            setActionError("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="list-card-row polished-list-card-row">
                      <Link
                        to={`/list/${list._id}`}
                        className="dashboard-card-link concept-one-card-link polished-card-link"
                        aria-label={`Open ${list.name}`}
                      >
                        <div className="list-card-icon">
                          {list.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="list-card-copy">
                          <h2>{list.name}</h2>

                          <div className="list-card-status-row polished-status-row">
                            <span
                              className={`polished-status-pill ${
                                isShared ? "shared" : "private"
                              }`}
                            >
                              {isShared ? sharedLabel : "Private"}
                            </span>

                            {isShared && (
                              <div
                                className="inline-member-avatars"
                                aria-label={sharedLabel}
                              >
                                {list.members
                                  .slice(0, 3)
                                  .map((member) => (
                                    <div
                                      className="mini-avatar"
                                      key={member._id}
                                      title={member.name}
                                    >
                                      {member.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  ))}

                                {list.members.length > 3 && (
                                  <div className="mini-avatar mini-avatar-more">
                                    +{list.members.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {userOwnsList && (
                        <div className="list-card-menu-wrap">
                          <button
                            type="button"
                            className="list-card-menu-button"
                            aria-label={`More options for ${list.name}`}
                            aria-expanded={openMenuListId === list._id}
                            onClick={() =>
                              setOpenMenuListId((current) =>
                                current === list._id ? null : list._id
                              )
                            }
                          >
                            ⋯
                          </button>

                          {openMenuListId === list._id && (
                            <div className="list-card-menu">
                              <button
                                type="button"
                                onClick={() => startEditing(list)}
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                className="menu-danger"
                                onClick={() => deleteList(list._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link to="/" className="mobile-bottom-nav-item active">
          <span className="mobile-nav-icon polished-mobile-nav-icon">
            <NavIcon type="lists" />
          </span>
          <span>Lists</span>
        </Link>

        <Link to="/today" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon polished-mobile-nav-icon">
            <NavIcon type="today" />
          </span>
          <span>Today</span>
        </Link>

        <Link to="/upcoming" className="mobile-bottom-nav-item">
          <span className="mobile-nav-icon polished-mobile-nav-icon">
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

export default ListsPage;
