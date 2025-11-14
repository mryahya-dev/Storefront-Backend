// src/config/cookie.ts
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // require HTTPS in prod
  sameSite: "strict" as "lax" | "strict" | "none",
  maxAge: 8 * 60 * 60 * 1000, // 8 hours (ms)
  path: "/",
  // domain: process.env.COOKIE_DOMAIN || undefined, // set if needed for subdomains
};
