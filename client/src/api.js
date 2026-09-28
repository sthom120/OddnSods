import {
  clearStoredSession,
} from "./auth";

const API_URL = "http://localhost:3000/api";

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith("/auth/")
    ) {
      clearStoredSession();

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login"
        );
      }
    }

    throw new Error(
      data?.message ||
        "Something went wrong"
    );
  }

  return data;
};
