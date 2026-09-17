/**
 * In-memory dedup fallback (Redis DOWN hone par).
 *
 * attendanceAlert + lateMark jobs Redis keys par dedup karte hain. Jab Redis
 * unreachable ho (enableOfflineQueue=false → turant throw), to ye Set un
 * keys ko is process ke andar yaad rakhta hai taake 15-min wala cron aadhi
 * deadline par SEPHIR emails/notifications na bheje (spam na ho).
 *
 * Note: single-instance deployments ke liye kafi hai; multi-instance / restart
 * ke gaps Redis-dedup se better na bhi ho to bhi "never fire" se behtar hai.
 */

const memory = new Set();

/** true agar ye key is process me pehle set ho chuki hai. */
export function dedupHas(key) {
  return memory.has(key);
}

/** Is process me key flag kar do. */
export function dedupSet(key) {
  memory.add(key);
}

export default { has: dedupHas, set: dedupSet };