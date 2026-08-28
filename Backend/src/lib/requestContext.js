import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped tenant context (AsyncLocalStorage).
 *
 * app.js request ke shuru mein ek empty store ke saath ALS.run() karta hai;
 * auth middleware authenticated user ka organizationId isi store mein likh
 * deta hai. storage.service jaisi deep layers ko har call site par
 * `organizationId` pass kiye baghair tenant resolve karne deta hai —
 * BullMQ workers (separate process, no HTTP request) ke liye ye null hota
 * hai, wahan explicit param use hota hai.
 */
const als = new AsyncLocalStorage();

/** Express middleware — har request ko apne isolated store mein chalata hai. */
export const requestContextMiddleware = (req, res, next) => {
  als.run({}, () => next());
};

/** Auth ke baad call karo — tenant context set ho jata hai. */
export const setRequestOrganization = (organizationId) => {
  const store = als.getStore();
  if (store) store.organizationId = organizationId || null;
};

/** Current request ka org id (ya null jab context/portal/worker na ho). */
export const getRequestOrganizationId = () => als.getStore()?.organizationId ?? null;

/** Test helper. */
export const clearRequestContext = () => als.disable();
