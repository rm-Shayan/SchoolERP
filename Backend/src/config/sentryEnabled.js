// Single source of truth: is Sentry enabled on this box?
// SENTRY_DISABLED=1 (docker: 256MB tier) ya missing DSN → Sentry module is
// never imported, so @sentry/node (~30-40MB of instrumented code) is not
// loaded at boot. Keeping it out of the import graph is what actually saves
// the memory — a disabled-but-imported Sentry still loads the full package.
export const sentryEnabled =
  process.env.SENTRY_DISABLED !== "1" &&
  Boolean(process.env.SENTRY_DSN);