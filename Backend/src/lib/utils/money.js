/**
 * Money helpers — Prisma Decimal(10,2) fields ko JS me Number parse karte hi
 * binary-float drift aa jata hai (0.1 + 0.2 !== 0.3). Cents (integer) me
 * compare/add karke exact result nikalte hain, aur boundary par
 * `Number((cents / 100).toFixed(2))` se 2-decimal Number wapas dete hain —
 * jo DB write ke liye Prisma chup-chaap Decimal me coerce kar leta hai.
 */

/** Value → integer paise. Invalid/null → 0. */
export const toCents = (value) => Math.round((Number(value) || 0) * 100);

/** Integer paise → 2-decimal Number. */
export const fromCents = (cents) => Number(((Number(cents) || 0) / 100).toFixed(2));

/** Do money values exact equal hain? (cent precision par) */
export const moneyEq = (a, b) => toCents(a) === toCents(b);

/** a >= b (cent precision par). */
export const moneyGte = (a, b) => toCents(a) >= toCents(b);

/** a > b (cent precision par). */
export const moneyGt = (a, b) => toCents(a) > toCents(b);

/** Baaki balance = totalAmount + dueCharges - paidAmount (cent precision). */
export const feeBalance = ({ totalAmount, dueCharges, paidAmount } = {}) =>
  fromCents(toCents(totalAmount) + toCents(dueCharges) - toCents(paidAmount));

/**
 * Payment ke baad fee status — dueCharges bhi total me count hote hain.
 * PAID sirf tab jab (paidAmount >= totalAmount + dueCharges), warna PARTIAL.
 */
export const feeStatusAfterPayment = (totalAmount, dueCharges, paidAmount) =>
  moneyGte(paidAmount, fromCents(toCents(totalAmount) + toCents(dueCharges))) ? "PAID" : "PARTIAL";
