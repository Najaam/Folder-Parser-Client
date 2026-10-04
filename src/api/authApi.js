const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw data.message ? data : { message: "Request failed" };
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ name, email, password })
  });

  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  return data;
}

export async function loginUser({ email, password, rememberMe = false }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ email, password, rememberMe })
  });

  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  return data;
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    })
      .then(parseResponse)
      .then((data) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .catch((error) => {
        setAccessToken(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  setAccessToken(null);
  return parseResponse(response);
}

export async function authenticatedRequest(path, options = {}, shouldRetry = true) {
  const token = getAccessToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && shouldRetry) {
    try {
      await refreshSession();
    } catch (error) {
      setAccessToken(null);
      throw error;
    }

    return authenticatedRequest(path, options, false);
  }

  return parseResponse(response);
}

export function fetchProfile() {
  return authenticatedRequest("/auth/profile", {
    method: "GET"
  });
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

/**
 * Sends OTP to the given email with pending registration data.
 */
export async function sendOtp({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  return parseResponse(response);
}

/**
 * Verifies the OTP code and creates the user account.
 */
export async function verifyOtp({ email, code }) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code })
  });
  return parseResponse(response);
}

/**
 * Resends OTP — calls send-otp again for the same email.
 * Requires the original registration data to be re-submitted.
 * For resend we only need email — backend will look up pending OTP.
 */
export async function resendOtp({ email }) {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, _resend: true })
  });
  return parseResponse(response);
}

// ─── Password ────────────────────────────────────────────────────────────────

/**
 * Changes the authenticated user's password.
 */
export function changePassword({ currentPassword, newPassword }) {
  return authenticatedRequest("/auth/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

/**
 * Sends a password reset OTP to the given email.
 */
export async function forgotPassword({ email }) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return parseResponse(response);
}

/**
 * Verifies OTP and sets a new password.
 */
export async function resetPassword({ email, code, newPassword }) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword })
  });
  return parseResponse(response);
}

// ─── Session Management ───────────────────────────────────────────────────────
/**
 * Returns all active refresh token sessions for the current user.
 * Each session includes: id, userAgent, ipAddress, createdAt, expiresAt
 */
export function fetchSessions() {
  return authenticatedRequest("/auth/sessions", {
    method: "GET"
  });
}

/**
 * Revokes a single session by its RefreshToken document ID.
 * Useful for "log out of this device" functionality.
 */
export function revokeSession(sessionId) {
  return authenticatedRequest(`/auth/sessions/${sessionId}`, {
    method: "DELETE"
  });
}

/**
 * Revokes ALL active sessions for the current user — logs out from every device.
 * The current session cookie is also cleared server-side.
 */
export function revokeAllSessions() {
  return authenticatedRequest("/auth/sessions", {
    method: "DELETE"
  });
}
