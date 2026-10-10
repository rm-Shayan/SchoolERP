/**
 * Sentry bootstrap — `node --import` se load hota hai, isliye ye app ke kisi
 * bhi module (express, http) se PEHLE chalta hai. Isi liye Sentry unhe
 * instrument kar pata hai.
 *
 * Pehle ye app.js ke andar `initMonitoring()` tha — lekin app.js ki line 1 par
 * `import express` hone ki wajah se Sentry.init() express ke BAAD hota tha aur
 * Sentry har boot par warn karta tha:
 *   "[Sentry] express is not instrumented. ... initialize Sentry in a
 *    separate file that you `--import` when running node"
 * Isi wajah se automatic request tracing/perf capture nahi ho rahi thi.
 *
 * `env.js` pehle import karna zaroori hai: `--import` main module se PEHLE
 * chalta hai, aur SENTRY_DSN tab tak process.env me load nahi hua hota.
 * (env.js apne aap NODE_ENV=local par dev.env, warna .env padhta hai.)
 *
 * node --env-file ka option parsing bootstrap ke dauraan hota hai, isliye
 * `npm run dev` par NODE_ENV yahan bhi sahi rehta hai.
 */

import "./env.js";
import { sentryEnabled } from "./sentryEnabled.js";

// Sentry is memory-heavy (~30-40MB at import) and the 256MB Suga tier was OOM
// killing the container on boot. When disabled, NEVER import the monitoring
// module — otherwise @sentry/node loads anyway and we gain nothing.
if (sentryEnabled) {
  const { default: initMonitoring } = await import("./monitoring.js");
  initMonitoring();
} else {
  console.log("[Sentry] disabled — instrumentation skipped");
}
