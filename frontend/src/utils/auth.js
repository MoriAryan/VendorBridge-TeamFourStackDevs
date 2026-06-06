/**
 * useCurrentUser — reads the JWT access token from localStorage and decodes it.
 * Handles URL-safe base64 (uses - and _ instead of + and /) which atob() can't handle.
 * Returns null if no token or decoding fails.
 */
export function getCurrentUser() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    // JWT payload is the middle segment — convert URL-safe base64 to standard base64
    const b64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    // Pad to 4-byte boundary
    const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isRole(...roles) {
  const user = getCurrentUser();
  return user ? roles.includes(user.role) : false;
}
