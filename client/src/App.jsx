import {
  Routes,
  Route,
} from "react-router-dom";

import ListsPage from "./pages/ListsPage";
import ListPage from "./pages/ListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DueItemsPage from "./pages/DueItemsPage";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
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
            <DueItemsPage mode="today" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upcoming"
        element={
          <ProtectedRoute>
            <DueItemsPage mode="upcoming" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;