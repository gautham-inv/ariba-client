/**
 * Base URL for the backend API. Set NEXT_PUBLIC_API_URL in production (e.g. on Render).
 */
export const API_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL !== "undefined" && process.env.NEXT_PUBLIC_API_URL !== ""
    ? process.env.NEXT_PUBLIC_API_URL
    : "https://ariba-api.onrender.com";
