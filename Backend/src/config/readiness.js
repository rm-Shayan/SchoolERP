/**
 * readiness.js
 *
 * Shared readiness state. Starts `false`; flips to `true` once ALL background
 * init tasks (DB warmup + BullMQ workers) have completed. The /ready endpoint
 * reads this; k8s readiness probes use /ready to decide when to send traffic.
 */

let ready = false;

/** Called once after all background init tasks finish. */
export const markReady = () => { ready = true; };

/** Synchronous check — used by the /ready Express handler. */
export const isReady = () => ready;
