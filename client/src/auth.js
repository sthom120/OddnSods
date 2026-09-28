export const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const decodeJwtPayload = (token) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const base64 = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    "="
  );

  return JSON.parse(atob(padded));
};

export const hasValidStoredSession = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const payload = decodeJwtPayload(token);

    if (
      !payload ||
      typeof payload.exp !== "number"
    ) {
      clearStoredSession();
      return false;
    }

    if (payload.exp * 1000 <= Date.now()) {
      clearStoredSession();
      return false;
    }

    return true;
  } catch {
    clearStoredSession();
    return false;
  }
};
