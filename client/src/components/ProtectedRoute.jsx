import { Navigate } from "react-router-dom";
import {
  hasValidStoredSession,
} from "../auth";

function ProtectedRoute({ children }) {
  if (!hasValidStoredSession()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
