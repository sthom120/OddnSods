import {
  useEffect,
  useState,
} from "react";

import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import ListsPage from "./pages/ListsPage";
import ListPage from "./pages/ListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DueItemsPage from "./pages/DueItemsPage";
import ProfilePage from "./pages/ProfilePage";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";
import "./MyListsConcept.css";

function App() {
  const navigate = useNavigate();

  const [
    foregroundNotification,
    setForegroundNotification,
  ] = useState(null);

  useEffect(() => {
    let timeoutId;

    const handleNotification = (
      event
    ) => {
      const notification =
        event.detail;

      setForegroundNotification(
        notification
      );

      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setForegroundNotification(
          null
        );
      }, 6000);
    };

    window.addEventListener(
      "oddsnsods-notification",
      handleNotification
    );

    return () => {
      window.removeEventListener(
        "oddsnsods-notification",
        handleNotification
      );

      clearTimeout(timeoutId);
    };
  }, []);

  const openNotification = () => {
    if (
      foregroundNotification
        ?.listId
    ) {
      navigate(
        `/list/${foregroundNotification.listId}`
      );
    }

    setForegroundNotification(
      null
    );
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ListsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/list/:id"
          element={
            <ProtectedRoute>
              <ListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/today"
          element={
            <ProtectedRoute>
              <DueItemsPage
                mode="today"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upcoming"
          element={
            <ProtectedRoute>
              <DueItemsPage
                mode="upcoming"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>

      {foregroundNotification && (
        <div
          className="notification-toast"
          role="status"
        >
          <button
            type="button"
            className="notification-toast-main"
            onClick={
              openNotification
            }
          >
            <div className="notification-toast-icon">
              ✓
            </div>

            <div className="notification-toast-text">
              <strong>
                {
                  foregroundNotification
                    .title
                }
              </strong>

              <span>
                {
                  foregroundNotification
                    .body
                }
              </span>
            </div>
          </button>

          <button
            type="button"
            className="notification-toast-close"
            aria-label="Close notification"
            onClick={() =>
              setForegroundNotification(
                null
              )
            }
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default App;