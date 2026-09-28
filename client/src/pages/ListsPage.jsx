import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  enableNotifications,
  syncNotificationsIfAllowed,
  unregisterNotifications,
} from "../notifications";

function ListsPage() {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [notificationMessage, setNotificationMessage] =
    useState("");

  const turnOnNotifications = async () => {
    setNotificationMessage("");

    const result = await enableNotifications();

    if (result.success) {
      setNotificationMessage(
        "Notifications are on."
      );
    } else {
      setNotificationMessage(
        result.message
      );
    }
  };

  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  useEffect(() => {
    fetchLists();
    syncNotificationsIfAllowed();
  }, []);

  const fetchLists = async () => {
    try {
      const data = await apiFetch("/lists");
      setLists(data);
    } catch (error) {
      console.error("Failed to fetch lists:", error);
    }
  };

  const createList = async (e) => {
    e.preventDefault();

    if (!newListName.trim()) return;

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
      console.error("Failed to create list:", error);
    }
  };

  const startEditing = (list) => {
    setEditingListId(list._id);
    setEditingName(list.name);
  };

  const saveListName = async (listId) => {
    if (!editingName.trim()) return;

    try {
      const updatedList = await apiFetch(
        `/lists/${listId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editingName,
          }),
        }
      );

      setLists((current) =>
        current.map((list) =>
          list._id === updatedList._id
            ? updatedList
            : list
        )
      );

      setEditingListId(null);
      setEditingName("");
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  const deleteList = async (listId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this list?"
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/lists/${listId}`, {
        method: "DELETE",
      });

      setLists((current) =>
        current.filter((list) => list._id !== listId)
      );
    } catch (error) {
      console.error("Failed to delete list:", error);
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
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <span>OddsnSods</span>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className="nav-item active"
          >
            <span>☰</span>
            My Lists
          </Link>

          <Link
            to="/today"
            className="nav-item"
          >
            <span>○</span>
            Today
          </Link>

          <Link
            to="/upcoming"
            className="nav-item"
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
                {currentUser?.name || "User"}
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

          <button
            type="button"
            className="logout-button"
            onClick={turnOnNotifications}
          >
            Enable notifications
          </button>

          {notificationMessage && (
            <small>
              {notificationMessage}
            </small>
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">
              YOUR SPACE
            </p>

            <h1>My Lists</h1>

            <p className="dashboard-subtitle">
              Keep everything somewhere other than
              your head.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowNewListForm(true)
            }
          >
            + New list
          </button>
        </header>

        {showNewListForm && (
          <section className="new-list-panel">
            <div>
              <h2>Create a new list</h2>

              <p>
                Give it a name. You can decide how
                it works afterwards.
              </p>
            </div>

            <form
              className="new-list-form"
              onSubmit={createList}
            >
              <input
                autoFocus
                value={newListName}
                onChange={(e) =>
                  setNewListName(e.target.value)
                }
                placeholder="e.g. Home, Uni, Holiday planning..."
              />

              <button
                className="primary-button"
                type="submit"
              >
                Create
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowNewListForm(false);
                  setNewListName("");
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {lists.length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon">✓</div>

            <h2>Nothing to hold onto yet</h2>

            <p>
              Create a list and get it out of your
              head.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setShowNewListForm(true)
              }
            >
              Create your first list
            </button>
          </section>
        ) : (
          <section className="lists-grid">
            {lists.map((list, index) => {
              const userOwnsList =
                list.owner?._id === currentUser?.id ||
                list.owner === currentUser?.id;

              return (
                <article
                  className={`dashboard-list-card ${getListColourClass(
                    index
                  )}`}
                  key={list._id}
                >
                  {editingListId === list._id &&
                  userOwnsList ? (
                    <div className="list-edit-panel">
                      <input
                        value={editingName}
                        onChange={(e) =>
                          setEditingName(e.target.value)
                        }
                      />

                      <div className="card-actions">
                        <button
                          className="small-button primary-small"
                          onClick={() =>
                            saveListName(list._id)
                          }
                        >
                          Save
                        </button>

                        <button
                          className="small-button"
                          onClick={() => {
                            setEditingListId(null);
                            setEditingName("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        to={`/list/${list._id}`}
                        className="dashboard-card-link"
                      >
                        <div className="list-card-icon">
                          {list.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h2>{list.name}</h2>

                          <p>
                            {list.members?.length > 0
                              ? `Shared with ${list.members.length} ${
                                  list.members.length === 1
                                    ? "person"
                                    : "people"
                                }`
                              : "Private list"}
                          </p>
                        </div>
                      </Link>

                      <div className="dashboard-card-footer">
                        <div className="member-avatars">
                          {list.members
                            ?.slice(0, 3)
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
                        </div>

                        {userOwnsList && (
                          <div className="card-actions">
                            <button
                              className="icon-button"
                              title="Rename list"
                              onClick={() =>
                                startEditing(list)
                              }
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button danger-icon"
                              title="Delete list"
                              onClick={() =>
                                deleteList(list._id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}

            <button
              className="create-list-card"
              onClick={() =>
                setShowNewListForm(true)
              }
            >
              <span className="create-list-plus">
                +
              </span>

              <strong>Create a new list</strong>

              <span>
                Clear one more thing from your mind.
              </span>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default ListsPage;
