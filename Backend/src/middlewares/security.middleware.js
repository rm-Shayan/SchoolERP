// Security response headers middleware.
// Express API endpoints default se koi security headers nahi set karte.
// Ye middleware har response par standard hardening headers add karta hai:
//   - nosniff         : browser ko MIME sniffing se rokta hai
//   - frame denial    : clickjacking protection
//   - referrer policy : cross-origin referrer leak band
//   - permis policy   : sensitive browser features band
//   - CSP             : XSS mitigation (API JSON responses ke liye permissive)
// Json + /uploads static assets par cache headers bhi set hote hai.

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-XSS-Protection", "0");

  // No-store for dynamic API responses (auth data / personal info cache na ho).
  // /uploads images immutable cache karte hain (app.js static par maxAge 7d).
  if (!req.path.startsWith("/uploads/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}
