import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  enableNotifications,
  unregisterNotifications,
} from "../notifications";
import "../ListPageConcept.css";

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

function ListPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("");
  const [newItemError, setNewItemError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [showAddDetails, setShowAddDetails] = useState(false);

  const [showCompleted, setShowCompleted] = useState(false);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingAssignedTo, setEditingAssignedTo] = useState("");
  const [editingRecurrence, setEditingRecurrence] = useState("");
  const [editingError, setEditingError] = useState("");

  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [openItemMenuId, setOpenItemMenuId] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "U";

  const isOwner =
    list?.owner?._id === currentUser?.id || list?.owner === currentUser?.id;

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      setLoadingPage(true);
      setPageError("");
      setActionError("");

      try {
        const [listData, itemData] = await Promise.all([
          apiFetch(`/lists/${id}`),
          apiFetch(`/items/list/${id}`),
        ]);

        if (cancelled) return;

        setList(listData);
        setItems(itemData);

        const savedShowCompleted = localStorage.getItem(
          `showCompleted-${id}`
        );

        if (savedShowCompleted !== null) {
          setShowCompleted(savedShowCompleted === "true");
        } else {
          setShowCompleted(false);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load list page:", error);
        setPageError(
          error.message === "List not found"
            ? "This list isn't available to this account. It may have been deleted or unshared."
            : "We couldn't load this list. Please try again."
        );
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

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

  const updateListSetting = async (settingName, value) => {
    setActionError("");

    try {
      const updatedList = await apiFetch(`/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          settings: {
            ...list.settings,
            [settingName]: value,
          },
        }),
      });

      setList(updatedList);

      if (settingName === "assignmentEnabled" && !value) {
        setNewAssignedTo("");
      }

      if (settingName === "dueDatesEnabled" && !value) {
        setNewDueDate("");
        setNewRecurrence("");
      }
    } catch (error) {
      console.error("Failed to update list setting:", error);
      setActionError(error.message);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    setNewItemError("");
    setActionError("");

    if (!newItemTitle.trim()) return;

    if (
      list.settings?.dueDatesEnabled &&
      newRecurrence &&
      !newDueDate
    ) {
      setNewItemError(
        "Choose a due date before making this item repeat."
      );
      return;
    }

    try {
      const newItem = await apiFetch("/items", {
        method: "POST",
        body: JSON.stringify({
          listId: id,
          title: newItemTitle.trim(),
          dueDate: list.settings?.dueDatesEnabled
            ? newDueDate || null
            : null,
          assignedTo: list.settings?.assignmentEnabled
            ? newAssignedTo || null
            : null,
          recurrence:
            list.settings?.dueDatesEnabled && newRecurrence
              ? { frequency: newRecurrence }
              : null,
        }),
      });

      setItems((current) => [...current, newItem]);
      setNewItemTitle("");
      setNewDueDate("");
      setNewAssignedTo("");
      setNewRecurrence("");
      setNewItemError("");
      setShowAddDetails(false);
      setComposerOpen(false);
    } catch (error) {
      setNewItemError(error.message);
    }
  };

  const toggleItem = async (item) => {
    setActionError("");

    try {
      const updatedItem = await apiFetch(`/items/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !item.completed }),
      });

      setItems((current) =>
        current.map((existingItem) =>
          existingItem._id === updatedItem._id ? updatedItem : existingItem
        )
      );
    } catch (error) {
      console.error("Failed to update item:", error);
      setActionError(error.message);
    }
  };

  const startEditingItem = (item) => {
    setActionError("");
    setOpenItemMenuId(null);
    setEditingItemId(item._id);
    setEditingTitle(item.title);
    setEditingAssignedTo(item.assignedTo?._id || "");
    setEditingDueDate(item.dueDate ? item.dueDate.split("T")[0] : "");
    setEditingRecurrence(item.recurrence?.frequency || "");
    setEditingError("");
  };

  const saveItemEdit = async (itemId) => {
    setEditingError("");
    setActionError("");

    if (!editingTitle.trim()) return;

    if (
      list.settings?.dueDatesEnabled &&
      editingRecurrence &&
      !editingDueDate
    ) {
      setEditingError(
        "Choose a due date before making this item repeat."
      );
      return;
    }

    try {
      const updateData = { title: editingTitle.trim() };

      if (list.settings?.assignmentEnabled) {
        updateData.assignedTo = editingAssignedTo || null;
      }

      if (list.settings?.dueDatesEnabled) {
        updateData.dueDate = editingDueDate || null;
        updateData.recurrence = editingRecurrence
          ? { frequency: editingRecurrence }
          : null;
      }

      const updatedItem = await apiFetch(`/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      setItems((current) =>
        current.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );

      cancelItemEdit();
    } catch (error) {
      setEditingError(error.message);
    }
  };

  const cancelItemEdit = () => {
    setEditingItemId(null);
    setEditingTitle("");
    setEditingAssignedTo("");
    setEditingDueDate("");
    setEditingRecurrence("");
    setEditingError("");
  };

  const deleteItem = async (itemId) => {
    setOpenItemMenuId(null);
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    setActionError("");

    try {
      await apiFetch(`/items/${itemId}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item._id !== itemId));
    } catch (error) {
      console.error("Failed to delete item:", error);
      setActionError(error.message);
    }
  };

  const toggleShowCompleted = () => {
    const newValue = !showCompleted;
    setShowCompleted(newValue);
    localStorage.setItem(`showCompleted-${id}`, String(newValue));
  };

  const shareList = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      const updatedList = await apiFetch(`/lists/${id}/share`, {
        method: "POST",
        body: JSON.stringify({ email: shareEmail.trim() }),
      });

      setList(updatedList);
      setShareEmail("");
      setShareStatus("success");
      setShareMessage("List shared successfully.");
    } catch (error) {
      setShareStatus("error");
      setShareMessage(error.message);
    }
  };

  const removeMember = async (userId) => {
    try {
      const updatedList = await apiFetch(`/lists/${id}/members/${userId}`, {
        method: "DELETE",
      });

      setList(updatedList);
      setShareStatus("success");
      setShareMessage("Access removed.");
    } catch (error) {
      setShareStatus("error");
      setShareMessage(error.message);
    }
  };

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isOverdue = (item) => {
    if (!item.dueDate || item.completed) return false;
    return item.dueDate.split("T")[0] < getLocalDateString();
  };

  const formatTaskDueDate = (date) => {
    if (!date) return "";

    const dateOnly = date.split("T")[0];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateOnly === getLocalDateString(today)) return "Today";
    if (dateOnly === getLocalDateString(tomorrow)) return "Tomorrow";

    const [year, month, day] = dateOnly.split("-").map(Number);
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(year, month - 1, day));
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

  if (loadingPage) {
    return (
      <main className="list-page-shell notebook-list-page notebook-loading">
        <div className="loading-dot" />
        <p>Loading your list...</p>
      </main>
    );
  }

  if (pageError || !list) {
    return (
      <main className="list-page-shell notebook-list-page">
        <Link to="/" className="notebook-back-link">
          ‹ My Lists
        </Link>
        <div className="list-empty-items">
          <h2>Couldn't load this list</h2>
          <p>{pageError || "This list isn't available."}</p>
          <button
            type="button"
            className="primary-modern-button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const activeItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);
  const incompleteCount = activeItems.length;
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const completionPercent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;
  const allMembers = [list.owner, ...(list.members || [])].filter(Boolean);
  const hasAddDetails =
    list.settings?.assignmentEnabled || list.settings?.dueDatesEnabled;
  const isShared = (list.members?.length || 0) > 0;

  const renderTask = (item) => (
    <article
      className={`notebook-task-row ${
        item.completed ? "task-completed" : ""
      }`}
      key={item._id}
    >
      {editingItemId === item._id ? (
        <div className="modern-edit-form notebook-edit-form">
          <label>
            Item
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
          </label>

          <div className="edit-field-grid">
            {list.settings?.assignmentEnabled && (
              <label>
                Assigned to
                <select
                  value={editingAssignedTo}
                  onChange={(e) => setEditingAssignedTo(e.target.value)}
                >
                  <option value="">Anyone</option>
                  {allMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {list.settings?.dueDatesEnabled && (
              <label>
                Due date
                <input
                  type="date"
                  value={editingDueDate}
                  onChange={(e) => setEditingDueDate(e.target.value)}
                />
              </label>
            )}

            {list.settings?.dueDatesEnabled && (
              <label>
                Repeat
                <select
                  value={editingRecurrence}
                  onChange={(e) => setEditingRecurrence(e.target.value)}
                >
                  <option value="">Doesn't repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            )}
          </div>

          {editingError && (
            <p className="form-error-message">{editingError}</p>
          )}

          <div className="modern-edit-actions">
            <button
              type="button"
              className="secondary-modern-button"
              onClick={cancelItemEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-modern-button"
              onClick={() => saveItemEdit(item._id)}
            >
              Save changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <label className="task-check-area notebook-task-check">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item)}
            />
            <span className="custom-task-checkbox">✓</span>
          </label>

          <div className="notebook-task-content">
            <h3>{item.title}</h3>

            {list.settings?.assignmentEnabled ||
            item.dueDate ||
            item.recurrence?.frequency ? (
              <div className="notebook-task-meta">
                {list.settings?.assignmentEnabled && (
                  <span className="notebook-person-meta">
                    <span className="notebook-person-avatar">
                      {item.assignedTo?.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                    {item.assignedTo?.name || "Anyone"}
                  </span>
                )}

                {item.dueDate && (
                  <span
                    className={`notebook-date-meta ${
                      isOverdue(item) ? "overdue" : ""
                    }`}
                  >
                    {isOverdue(item) ? "Overdue · " : ""}
                    {formatTaskDueDate(item.dueDate)}
                  </span>
                )}

                {item.recurrence?.frequency && (
                  <span className="notebook-repeat-meta">
                    ↻ {formatRecurrence(item.recurrence.frequency)}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="notebook-item-menu-wrap">
            <button
              type="button"
              className="notebook-item-menu-button"
              aria-label={`Options for ${item.title}`}
              aria-expanded={openItemMenuId === item._id}
              onClick={() =>
                setOpenItemMenuId((current) =>
                  current === item._id ? null : item._id
                )
              }
            >
              ⋯
            </button>

            {openItemMenuId === item._id && (
              <div className="notebook-menu notebook-item-menu">
                <button type="button" onClick={() => startEditingItem(item)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="notebook-menu-danger"
                  onClick={() => deleteItem(item._id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );

  return (
    <main className="list-page-shell notebook-list-page">
      <div className="notebook-list-topbar">
        <Link to="/" className="notebook-back-link">
          ‹ My Lists
        </Link>

        {isOwner && (
          <div className="notebook-list-menu-wrap">
            <button
              type="button"
              className="notebook-more-button"
              aria-label="List options"
              aria-expanded={showListMenu}
              onClick={() => setShowListMenu((current) => !current)}
            >
              ⋯
            </button>

            {showListMenu && (
              <div className="notebook-menu notebook-list-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowListMenu(false);
                    setShareMessage("");
                    setShowShareModal(true);
                  }}
                >
                  Share list
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowListMenu(false);
                    setShowSettingsModal(true);
                  }}
                >
                  List settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <p className="form-error-message notebook-page-error">{actionError}</p>
      )}

      <section className="notebook-list-hero">
        <div className="notebook-title-row">
          <div className="notebook-list-icon">
            {list.name.charAt(0).toUpperCase()}
          </div>
          <div className="notebook-title-copy">
            <h1>{list.name}</h1>

            <div className="notebook-sharing-summary">
              {isShared ? (
                <>
                  <div className="notebook-member-avatars" aria-hidden="true">
                    {allMembers.slice(0, 3).map((member) => (
                      <span
                        className="notebook-mini-avatar"
                        key={member._id || member.id}
                      >
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <span>
                    {list.members.length === 1
                      ? "Shared with 1 person"
                      : `Shared with ${list.members.length} people`}
                  </span>
                </>
              ) : (
                <span>Private list</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="notebook-progress" aria-label="List progress">
        <div className="notebook-progress-copy">
          <span>
            {incompleteCount} left
            {completedCount > 0 ? ` · ${completedCount} completed` : ""}
          </span>
          <strong>{completionPercent}%</strong>
        </div>
        <div className="notebook-progress-track" aria-hidden="true">
          <span style={{ width: `${completionPercent}%` }} />
        </div>
      </section>

      <section className="notebook-tasks-section">
        {activeItems.length === 0 ? (
          <div className="notebook-empty-active">
            <span>✓</span>
            <div>
              <h2>Nothing waiting for you</h2>
              <p>Add something whenever it comes to mind.</p>
            </div>
          </div>
        ) : (
          <div className="notebook-task-list">
            {activeItems.map(renderTask)}
          </div>
        )}

        {completedCount > 0 && (
          <div className="notebook-completed-section">
            <button
              type="button"
              className="notebook-completed-toggle"
              aria-expanded={showCompleted}
              onClick={toggleShowCompleted}
            >
              <span className={`notebook-completed-chevron ${
                showCompleted ? "open" : ""
              }`}>
                ›
              </span>
              <span>Completed ({completedCount})</span>
            </button>

            {showCompleted && (
              <div className="notebook-task-list notebook-completed-list">
                {completedItems.map(renderTask)}
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className={`notebook-add-dock ${composerOpen ? "open" : ""}`}
      >
        <form onSubmit={addItem}>
          {composerOpen && (
            <div className="notebook-composer-panel">
              {showAddDetails && hasAddDetails && (
                <div className="notebook-add-details">
                  {list.settings?.assignmentEnabled && (
                    <label>
                      <span>Assign to</span>
                      <select
                        value={newAssignedTo}
                        onChange={(e) => setNewAssignedTo(e.target.value)}
                      >
                        <option value="">Anyone</option>
                        {allMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {list.settings?.dueDatesEnabled && (
                    <label>
                      <span>Due date</span>
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                      />
                    </label>
                  )}

                  {list.settings?.dueDatesEnabled && (
                    <label>
                      <span>Repeat</span>
                      <select
                        value={newRecurrence}
                        onChange={(e) => setNewRecurrence(e.target.value)}
                      >
                        <option value="">Doesn't repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="notebook-composer-actions">
                {hasAddDetails && (
                  <button
                    type="button"
                    className="notebook-details-button"
                    onClick={() => setShowAddDetails((current) => !current)}
                  >
                    {showAddDetails ? "Hide details" : "Add details"}
                  </button>
                )}
                <button
                  type="submit"
                  className="notebook-add-button"
                  disabled={!newItemTitle.trim()}
                >
                  Add item
                </button>
              </div>
            </div>
          )}

          <div className="notebook-add-main">
            <span className="notebook-add-plus">+</span>
            <input
              type="text"
              value={newItemTitle}
              onFocus={() => setComposerOpen(true)}
              onChange={(e) => {
                setNewItemTitle(e.target.value);
                setComposerOpen(true);
              }}
              placeholder="Add a new task..."
              aria-label="New item"
            />
            <button
              type="button"
              className="notebook-add-expand"
              aria-label={composerOpen ? "Collapse add item" : "Open add item"}
              onClick={() => setComposerOpen((current) => !current)}
            >
              {composerOpen ? "⌃" : "⌄"}
            </button>
          </div>
        </form>

        {newItemError && (
          <p className="form-error-message notebook-add-error">
            {newItemError}
          </p>
        )}
      </section>

      {showShareModal && (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)}>
          <section className="app-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <p className="modal-kicker">SHARE</p>
                <h2>Share “{list.name}”</h2>
                <p>People you add can view and update items in this list.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowShareModal(false)}
              >
                ×
              </button>
            </div>

            <form className="share-modal-form" onSubmit={shareList}>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter their email address"
              />
              <button type="submit" className="primary-modern-button">
                Share
              </button>
            </form>

            {shareMessage && (
              <div className={`share-feedback ${shareStatus}`}>
                {shareMessage}
              </div>
            )}

            <div className="modal-member-list">
              <h3>People with access</h3>

              <div className="modal-member-row">
                <div className="member-details">
                  <div className="member-avatar owner-avatar">
                    {list.owner?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{list.owner?.name}</strong>
                    {list.owner?.email && <span>{list.owner.email}</span>}
                  </div>
                </div>
                <span className="owner-label">Owner</span>
              </div>

              {list.members?.map((member) => (
                <div className="modal-member-row" key={member._id}>
                  <div className="member-details">
                    <div className="member-avatar">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{member.name}</strong>
                      {member.email && <span>{member.email}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-member-button"
                    onClick={() => removeMember(member._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {showSettingsModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSettingsModal(false)}
        >
          <section
            className="app-modal settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="modal-kicker">LIST SETTINGS</p>
                <h2>{list.name}</h2>
                <p>Turn on only the features that are useful for this list.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowSettingsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-option-list">
              <label className="settings-option">
                <div>
                  <strong>Assign items</strong>
                  <span>Choose who is responsible for an item.</span>
                </div>
                <input
                  type="checkbox"
                  checked={list.settings?.assignmentEnabled ?? true}
                  onChange={(e) =>
                    updateListSetting("assignmentEnabled", e.target.checked)
                  }
                />
              </label>

              <label className="settings-option">
                <div>
                  <strong>Due dates</strong>
                  <span>
                    Add dates when something needs to happen. Recurring items use
                    due dates too.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={list.settings?.dueDatesEnabled || false}
                  onChange={(e) =>
                    updateListSetting("dueDatesEnabled", e.target.checked)
                  }
                />
              </label>
            </div>
          </section>
        </div>
      )}

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

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link to="/" className="mobile-bottom-nav-item active">
          <span className="notebook-mobile-nav-icon">
            <NavIcon type="lists" />
          </span>
          <span>Lists</span>
        </Link>

        <Link to="/today" className="mobile-bottom-nav-item">
          <span className="notebook-mobile-nav-icon">
            <NavIcon type="today" />
          </span>
          <span>Today</span>
        </Link>

        <Link to="/upcoming" className="mobile-bottom-nav-item">
          <span className="notebook-mobile-nav-icon">
            <NavIcon type="upcoming" />
          </span>
          <span>Upcoming</span>
        </Link>

        <button
          type="button"
          className={`mobile-bottom-nav-item ${showAccountMenu ? "active" : ""}`}
          onClick={() => setShowAccountMenu((current) => !current)}
        >
          <span className="mobile-nav-avatar">{userInitial}</span>
          <span>Profile</span>
        </button>
      </nav>
    </main>
  );
}

export default ListPage;
