import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";

function ListPage() {
  const { id } = useParams();

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // New item
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("");
  const [newItemError, setNewItemError] = useState("");

  // Display
  const [showCompleted, setShowCompleted] = useState(true);

  // Edit item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingAssignedTo, setEditingAssignedTo] = useState("");
  const [editingRecurrence, setEditingRecurrence] = useState("");
  const [editingError, setEditingError] = useState("");

  // Sharing
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const isOwner =
    list?.owner?._id === currentUser?.id ||
    list?.owner === currentUser?.id;

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      setLoadingPage(true);
      setPageError("");
      setActionError("");

      try {
        const [listData, itemData] =
          await Promise.all([
            apiFetch(`/lists/${id}`),
            apiFetch(`/items/list/${id}`),
          ]);

        if (cancelled) return;

        setList(listData);
        setItems(itemData);

        const savedShowCompleted =
          localStorage.getItem(
            `showCompleted-${id}`
          );

        if (savedShowCompleted !== null) {
          setShowCompleted(
            savedShowCompleted === "true"
          );
        } else {
          setShowCompleted(
            listData.settings
              ?.showCompleted ?? true
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load list page:",
          error
        );

        setPageError(
          error.message === "List not found"
            ? "This list isn't available to this account. It may have been deleted or unshared."
            : "We couldn't load this list. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // --------------------------------
  // LIST SETTINGS
  // --------------------------------

  const updateListSetting = async (
    settingName,
    value
  ) => {
    setActionError("");

    try {
      const updatedList = await apiFetch(
        `/lists/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            settings: {
              ...list.settings,
              [settingName]: value,
            },
          }),
        }
      );

      setList(updatedList);

      if (
        settingName === "assignmentEnabled" &&
        !value
      ) {
        setNewAssignedTo("");
      }

      if (
        settingName === "dueDatesEnabled" &&
        !value
      ) {
        setNewDueDate("");
        setNewRecurrence("");
      }
    } catch (error) {
      console.error(
        "Failed to update list setting:",
        error
      );

      setActionError(error.message);
    }
  };

  // --------------------------------
  // ADD ITEM
  // --------------------------------

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

          dueDate:
            list.settings?.dueDatesEnabled
              ? newDueDate || null
              : null,

          assignedTo:
            list.settings?.assignmentEnabled
              ? newAssignedTo || null
              : null,

          recurrence:
            list.settings?.dueDatesEnabled &&
            newRecurrence
              ? {
                  frequency: newRecurrence,
                }
              : null,
        }),
      });

      setItems((current) => [
        ...current,
        newItem,
      ]);

      setNewItemTitle("");
      setNewDueDate("");
      setNewAssignedTo("");
      setNewRecurrence("");
      setNewItemError("");
    } catch (error) {
      setNewItemError(error.message);
    }
  };

  // --------------------------------
  // COMPLETE ITEM
  // --------------------------------

  const toggleItem = async (item) => {
    setActionError("");

    try {
      const updatedItem = await apiFetch(
        `/items/${item._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            completed: !item.completed,
          }),
        }
      );

      setItems((current) =>
        current.map((existingItem) =>
          existingItem._id === updatedItem._id
            ? updatedItem
            : existingItem
        )
      );
    } catch (error) {
      console.error(
        "Failed to update item:",
        error
      );

      setActionError(error.message);
    }
  };

  // --------------------------------
  // EDIT ITEM
  // --------------------------------

  const startEditingItem = (item) => {
    setActionError("");
    setEditingItemId(item._id);
    setEditingTitle(item.title);

    setEditingAssignedTo(
      item.assignedTo?._id || ""
    );

    setEditingDueDate(
      item.dueDate
        ? item.dueDate.split("T")[0]
        : ""
    );

    setEditingRecurrence(
      item.recurrence?.frequency || ""
    );

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
      const updateData = {
        title: editingTitle.trim(),
      };

      if (list.settings?.assignmentEnabled) {
        updateData.assignedTo =
          editingAssignedTo || null;
      }

      if (list.settings?.dueDatesEnabled) {
        updateData.dueDate =
          editingDueDate || null;

        updateData.recurrence =
          editingRecurrence
            ? {
                frequency: editingRecurrence,
              }
            : null;
      }

      const updatedItem = await apiFetch(
        `/items/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      setItems((current) =>
        current.map((item) =>
          item._id === updatedItem._id
            ? updatedItem
            : item
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

  // --------------------------------
  // DELETE ITEM
  // --------------------------------

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm(
      "Delete this item?"
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await apiFetch(`/items/${itemId}`, {
        method: "DELETE",
      });

      setItems((current) =>
        current.filter(
          (item) => item._id !== itemId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete item:",
        error
      );

      setActionError(error.message);
    }
  };

  // --------------------------------
  // SHOW COMPLETED
  // --------------------------------

  const toggleShowCompleted = () => {
    const newValue = !showCompleted;

    setShowCompleted(newValue);

    localStorage.setItem(
      `showCompleted-${id}`,
      String(newValue)
    );
  };

  // --------------------------------
  // SHARING
  // --------------------------------

  const shareList = async (e) => {
    e.preventDefault();

    if (!shareEmail.trim()) return;

    try {
      const updatedList = await apiFetch(
        `/lists/${id}/share`,
        {
          method: "POST",
          body: JSON.stringify({
            email: shareEmail.trim(),
          }),
        }
      );

      setList(updatedList);
      setShareEmail("");
      setShareStatus("success");
      setShareMessage(
        "List shared successfully."
      );
    } catch (error) {
      setShareStatus("error");
      setShareMessage(error.message);
    }
  };

  const removeMember = async (userId) => {
    try {
      const updatedList = await apiFetch(
        `/lists/${id}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      setList(updatedList);
      setShareStatus("success");
      setShareMessage(
        "Access removed."
      );
    } catch (error) {
      setShareStatus("error");
      setShareMessage(error.message);
    }
  };

  // --------------------------------
  // HELPERS
  // --------------------------------

  const formatDueDate = (date) => {
    if (!date) return "";

    const dateOnly = date.split("T")[0];

    const [year, month, day] =
      dateOnly.split("-");

    return `${day}/${month}/${year}`;
  };

  const getLocalDateString = () => {
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

  const isOverdue = (item) => {
    if (
      !item.dueDate ||
      item.completed
    ) {
      return false;
    }

    const due =
      item.dueDate.split("T")[0];

    return due < getLocalDateString();
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

  // --------------------------------
  // LOADING / ERROR
  // --------------------------------

  if (loadingPage) {
    return (
      <main className="list-page-shell">
        <p>Loading...</p>
      </main>
    );
  }

  if (pageError || !list) {
    return (
      <main className="list-page-shell">
        <Link
          to="/"
          className="list-back-link"
        >
          ← My Lists
        </Link>

        <div className="list-empty-items">
          <h2>Couldn't load this list</h2>

          <p>
            {pageError ||
              "This list isn't available."}
          </p>

          <button
            type="button"
            className="primary-modern-button"
            onClick={() =>
              setReloadKey(
                (current) => current + 1
              )
            }
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------
  // DERIVED DATA
  // --------------------------------

  const visibleItems = showCompleted
    ? items
    : items.filter(
        (item) => !item.completed
      );

  const incompleteCount = items.filter(
    (item) => !item.completed
  ).length;

  const completedCount = items.filter(
    (item) => item.completed
  ).length;

  const allMembers = [
    list.owner,
    ...(list.members || []),
  ].filter(Boolean);

  // --------------------------------
  // PAGE
  // --------------------------------

  return (
    <main className="list-page-shell">
      {/* TOP BAR */}

      <div className="list-page-topbar">
        <Link
          to="/"
          className="list-back-link"
        >
          ← My Lists
        </Link>

        <div className="list-header-buttons">
          {isOwner && (
            <button
              type="button"
              className="soft-action-button"
              onClick={() => {
                setShareMessage("");
                setShowShareModal(true);
              }}
            >
              Share
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              className="soft-action-button"
              onClick={() =>
                setShowSettingsModal(true)
              }
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="form-error-message">
          {actionError}
        </p>
      )}

      {/* LIST HEADER */}

      <section className="list-hero">
        <div className="list-hero-main">
          <div className="list-big-icon">
            {list.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p className="list-kicker">
              {list.members?.length > 0
                ? "SHARED LIST"
                : "YOUR LIST"}
            </p>

            <h1>{list.name}</h1>

            <div className="list-member-summary">
              <div className="list-avatar-stack">
                {allMembers
                  .slice(0, 4)
                  .map((member) => (
                    <div
                      className="list-avatar"
                      key={
                        member._id ||
                        member.id
                      }
                      title={member.name}
                    >
                      {member.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                  ))}
              </div>

              {list.members?.length > 0 ? (
                <span>
                  Shared with{" "}
                  {list.members.length}{" "}
                  {list.members.length === 1
                    ? "person"
                    : "people"}
                </span>
              ) : (
                <span>Private</span>
              )}
            </div>
          </div>
        </div>

        <div className="list-feature-row">
          {list.settings
            ?.assignmentEnabled && (
            <span className="feature-chip">
              Assignment
            </span>
          )}

          {list.settings
            ?.dueDatesEnabled && (
            <span className="feature-chip">
              Due dates
            </span>
          )}

          <button
            type="button"
            className={`feature-chip feature-chip-button ${
              showCompleted
                ? "active"
                : ""
            }`}
            onClick={toggleShowCompleted}
          >
            {showCompleted ? "✓ " : ""}
            Show completed
          </button>
        </div>
      </section>

      {/* QUICK ADD */}

      <section className="quick-add-card">
        <form
          onSubmit={addItem}
          className="quick-add-form"
        >
          <div className="quick-add-main">
            <span className="quick-add-plus">
              +
            </span>

            <input
              type="text"
              value={newItemTitle}
              onChange={(e) =>
                setNewItemTitle(
                  e.target.value
                )
              }
              placeholder="What needs to be done?"
            />
          </div>

          <div className="quick-add-options">
            {list.settings
              ?.assignmentEnabled && (
              <select
                value={newAssignedTo}
                onChange={(e) =>
                  setNewAssignedTo(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Anyone
                </option>

                {allMembers.map(
                  (member) => (
                    <option
                      key={member._id}
                      value={member._id}
                    >
                      {member.name}
                    </option>
                  )
                )}
              </select>
            )}

            {list.settings
              ?.dueDatesEnabled && (
              <input
                type="date"
                value={newDueDate}
                onChange={(e) =>
                  setNewDueDate(
                    e.target.value
                  )
                }
              />
            )}

            {list.settings
              ?.dueDatesEnabled && (
              <select
                value={newRecurrence}
                onChange={(e) =>
                  setNewRecurrence(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Doesn't repeat
                </option>

                <option value="daily">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="fortnightly">
                  Fortnightly
                </option>

                <option value="monthly">
                  Monthly
                </option>
              </select>
            )}

            <button
              type="submit"
              className="add-task-button"
            >
              Add item
            </button>
          </div>
        </form>

        {newItemError && (
          <p className="form-error-message">
            {newItemError}
          </p>
        )}
      </section>

      {/* ITEMS */}

      <section className="tasks-section">
        <div className="tasks-section-header">
          <div>
            <h2>Items</h2>

            <p>
              {incompleteCount}{" "}
              {incompleteCount === 1
                ? "item"
                : "items"}{" "}
              remaining
              {completedCount > 0 &&
                ` · ${completedCount} completed`}
            </p>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="list-empty-items">
            <div className="list-empty-check">
              ✓
            </div>

            <h3>
              Nothing waiting for you
            </h3>

            <p>
              Add something above whenever
              it comes to mind.
            </p>
          </div>
        ) : (
          <div className="task-card-list">
            {visibleItems.map((item) => (
              <article
                className={`modern-task-card ${
                  item.completed
                    ? "task-completed"
                    : ""
                }`}
                key={item._id}
              >
                {editingItemId ===
                item._id ? (
                  <div className="modern-edit-form">
                    <label>
                      Item

                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) =>
                          setEditingTitle(
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <div className="edit-field-grid">
                      {list.settings
                        ?.assignmentEnabled && (
                        <label>
                          Assigned to

                          <select
                            value={
                              editingAssignedTo
                            }
                            onChange={(e) =>
                              setEditingAssignedTo(
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Anyone
                            </option>

                            {allMembers.map(
                              (member) => (
                                <option
                                  key={
                                    member._id
                                  }
                                  value={
                                    member._id
                                  }
                                >
                                  {
                                    member.name
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      )}

                      {list.settings
                        ?.dueDatesEnabled && (
                        <label>
                          Due date

                          <input
                            type="date"
                            value={
                              editingDueDate
                            }
                            onChange={(e) =>
                              setEditingDueDate(
                                e.target.value
                              )
                            }
                          />
                        </label>
                      )}

                      {list.settings
                        ?.dueDatesEnabled && (
                        <label>
                          Repeat

                          <select
                            value={
                              editingRecurrence
                            }
                            onChange={(e) =>
                              setEditingRecurrence(
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Doesn't repeat
                            </option>

                            <option value="daily">
                              Daily
                            </option>

                            <option value="weekly">
                              Weekly
                            </option>

                            <option value="fortnightly">
                              Fortnightly
                            </option>

                            <option value="monthly">
                              Monthly
                            </option>
                          </select>
                        </label>
                      )}
                    </div>

                    {editingError && (
                      <p className="form-error-message">
                        {editingError}
                      </p>
                    )}

                    <div className="modern-edit-actions">
                      <button
                        type="button"
                        className="secondary-modern-button"
                        onClick={
                          cancelItemEdit
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="primary-modern-button"
                        onClick={() =>
                          saveItemEdit(
                            item._id
                          )
                        }
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="task-check-area">
                      <input
                        type="checkbox"
                        checked={
                          item.completed
                        }
                        onChange={() =>
                          toggleItem(item)
                        }
                      />

                      <span className="custom-task-checkbox">
                        ✓
                      </span>
                    </label>

                    <div className="task-content">
                      <div className="task-title-row">
                        <h3>
                          {item.title}
                        </h3>
                      </div>

                      <div className="task-meta-row">
                        {list.settings
                          ?.assignmentEnabled && (
                          <span className="task-meta-person">
                            <span className="tiny-person-avatar">
                              {item.assignedTo
                                ?.name
                                ?.charAt(0)
                                .toUpperCase() ||
                                "A"}
                            </span>

                            {item.assignedTo
                              ? item
                                  .assignedTo
                                  .name
                              : "Anyone"}
                          </span>
                        )}

                        {item.dueDate && (
                          <span
                            className={`due-date-pill ${
                              isOverdue(
                                item
                              )
                                ? "overdue"
                                : ""
                            }`}
                          >
                            {isOverdue(item)
                              ? "Overdue · "
                              : "Due "}

                            {formatDueDate(
                              item.dueDate
                            )}
                          </span>
                        )}

                        {item.recurrence
                          ?.frequency && (
                          <span className="recurrence-pill">
                            ↻{" "}
                            {formatRecurrence(
                              item
                                .recurrence
                                .frequency
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="task-action-button"
                        onClick={() =>
                          startEditingItem(
                            item
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="task-action-button task-delete-button"
                        onClick={() =>
                          deleteItem(
                            item._id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SHARE MODAL */}

      {showShareModal && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowShareModal(false)
          }
        >
          <section
            className="app-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-heading">
              <div>
                <p className="modal-kicker">
                  SHARE
                </p>

                <h2>
                  Share “{list.name}”
                </h2>

                <p>
                  People you add can view
                  and update items in this
                  list.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowShareModal(false)
                }
              >
                ×
              </button>
            </div>

            <form
              className="share-modal-form"
              onSubmit={shareList}
            >
              <input
                type="email"
                value={shareEmail}
                onChange={(e) =>
                  setShareEmail(
                    e.target.value
                  )
                }
                placeholder="Enter their email address"
              />

              <button
                type="submit"
                className="primary-modern-button"
              >
                Share
              </button>
            </form>

            {shareMessage && (
              <div
                className={`share-feedback ${shareStatus}`}
              >
                {shareMessage}
              </div>
            )}

            <div className="modal-member-list">
              <h3>
                People with access
              </h3>

              <div className="modal-member-row">
                <div className="member-details">
                  <div className="member-avatar owner-avatar">
                    {list.owner?.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {list.owner?.name}
                    </strong>

                    {list.owner?.email && (
                      <span>
                        {list.owner.email}
                      </span>
                    )}
                  </div>
                </div>

                <span className="owner-label">
                  Owner
                </span>
              </div>

              {list.members?.map(
                (member) => (
                  <div
                    className="modal-member-row"
                    key={member._id}
                  >
                    <div className="member-details">
                      <div className="member-avatar">
                        {member.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {member.name}
                        </strong>

                        {member.email && (
                          <span>
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-member-button"
                      onClick={() =>
                        removeMember(
                          member._id
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}

      {/* SETTINGS MODAL */}

      {showSettingsModal && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowSettingsModal(false)
          }
        >
          <section
            className="app-modal settings-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-heading">
              <div>
                <p className="modal-kicker">
                  LIST SETTINGS
                </p>

                <h2>{list.name}</h2>

                <p>
                  Turn on only the
                  features that are
                  useful for this list.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowSettingsModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="settings-option-list">
              <label className="settings-option">
                <div>
                  <strong>
                    Assign items
                  </strong>

                  <span>
                    Choose who is
                    responsible for an
                    item.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={
                    list.settings
                      ?.assignmentEnabled ??
                    true
                  }
                  onChange={(e) =>
                    updateListSetting(
                      "assignmentEnabled",
                      e.target.checked
                    )
                  }
                />
              </label>

              <label className="settings-option">
                <div>
                  <strong>
                    Due dates
                  </strong>

                  <span>
                    Add dates when
                    something needs to
                    happen. Recurring
                    items use due dates
                    too.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={
                    list.settings
                      ?.dueDatesEnabled ||
                    false
                  }
                  onChange={(e) =>
                    updateListSetting(
                      "dueDatesEnabled",
                      e.target.checked
                    )
                  }
                />
              </label>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default ListPage;
