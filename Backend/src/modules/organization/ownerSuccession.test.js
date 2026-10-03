import { test } from "node:test";
import assert from "node:assert/strict";
import { countBranchAccess, isEligibleCandidate, pickOwnerSuccessor } from "./ownerSuccession.js";

function admin(overrides = {}) {
  return {
    id: "u1",
    name: "Admin",
    email: "admin@example.com",
    role: "ADMIN",
    isActive: true,
    isOrganizationOwner: false,
    blockedAt: null,
    schoolId: "s1",
    branchAccess: [],
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };
}

// ── countBranchAccess ──────────────────────────────────────────────────────
test("countBranchAccess counts array entries", () => {
  assert.equal(countBranchAccess(["a", "b", "c"]), 3);
  assert.equal(countBranchAccess([]), 0);
});

test("countBranchAccess tolerates null/undefined/non-array json", () => {
  assert.equal(countBranchAccess(null), 0);
  assert.equal(countBranchAccess(undefined), 0);
  assert.equal(countBranchAccess("not-an-array"), 0);
  assert.equal(countBranchAccess({ a: 1 }), 0);
});

// ── isEligibleCandidate ────────────────────────────────────────────────────
test("a plain active non-owner admin is eligible", () => {
  assert.equal(isEligibleCandidate(admin()), true);
});

test("non-admin roles are never eligible", () => {
  assert.equal(isEligibleCandidate(admin({ role: "TEACHER" })), false);
  assert.equal(isEligibleCandidate(admin({ role: "SUPER_ADMIN" })), false);
});

test("inactive admins are never eligible", () => {
  assert.equal(isEligibleCandidate(admin({ isActive: false })), false);
});

test("blocked admins are never eligible", () => {
  assert.equal(isEligibleCandidate(admin({ blockedAt: new Date() })), false);
});

test("the current owner is not a successor candidate", () => {
  assert.equal(isEligibleCandidate(admin({ isOrganizationOwner: true })), false);
});

// ── pickOwnerSuccessor ─────────────────────────────────────────────────────
test("no candidates → no successor (org keeps SUPER_ADMIN fallback)", () => {
  assert.equal(pickOwnerSuccessor([]), null);
});

test("only ineligible candidates → no successor", () => {
  assert.equal(pickOwnerSuccessor([admin({ isActive: false }), admin({ role: "TEACHER" })]), null);
});

test("single eligible admin is promoted", () => {
  const only = admin({ id: "u9", email: "only@example.com" });
  assert.equal(pickOwnerSuccessor([only]), only);
});

test("oldest admin wins when nobody manages extra branches", () => {
  const older = admin({ id: "u-new", email: "older@example.com", createdAt: new Date("2023-05-01T00:00:00Z") });
  const newer = admin({ id: "u-old", email: "newer@example.com", createdAt: new Date("2024-06-01T00:00:00Z") });
  // Age must decide, not the id order.
  assert.equal(pickOwnerSuccessor([older, newer]), older);
  assert.equal(pickOwnerSuccessor([newer, older]), older);
});

test("age outranks id order", () => {
  const older = admin({ id: "zzz", createdAt: new Date("2023-01-01T00:00:00Z") });
  const newer = admin({ id: "aaa", createdAt: new Date("2024-01-01T00:00:00Z") });
  assert.equal(pickOwnerSuccessor([newer, older]), older);
});

test("identical createdAt falls back to id ASC", () => {
  const sameTime = new Date("2024-01-01T00:00:00Z");
  const first = admin({ id: "a", createdAt: sameTime });
  const second = admin({ id: "b", createdAt: sameTime });
  assert.equal(pickOwnerSuccessor([second, first]), first);
});

test("multi-branch admin outranks an older single-branch admin", () => {
  const olderSingle = admin({ id: "u-old", email: "older@example.com", branchAccess: [] });
  const newerMulti = admin({ id: "u-new", email: "newer@example.com", branchAccess: ["s2", "s3"] });
  assert.equal(pickOwnerSuccessor([olderSingle, newerMulti]), newerMulti);
});

test("widest branch reach wins among multi-branch admins", () => {
  const olderTwo = admin({ id: "a", branchAccess: ["s2", "s3"], createdAt: new Date("2023-01-01T00:00:00Z") });
  const newerFour = admin({ id: "b", branchAccess: ["s2", "s3", "s4", "s5"], createdAt: new Date("2024-01-01T00:00:00Z") });
  assert.equal(pickOwnerSuccessor([olderTwo, newerFour]), newerFour);
});

test("equal reach falls through to age", () => {
  const older = admin({ id: "a", branchAccess: ["s2"], createdAt: new Date("2023-01-01T00:00:00Z") });
  const newer = admin({ id: "b", branchAccess: ["s9"], createdAt: new Date("2024-01-01T00:00:00Z") });
  assert.equal(pickOwnerSuccessor([older, newer]), older);
  // Input order must not change the outcome.
  assert.equal(pickOwnerSuccessor([newer, older]), older);
});

test("inactive/blocked admins are skipped even when they have the widest reach", () => {
  const inactiveWide = admin({ id: "a", branchAccess: ["s2", "s3", "s4"], isActive: false });
  const blockedWide = admin({ id: "b", branchAccess: ["s2", "s3", "s4", "s5"], blockedAt: new Date() });
  const healthyNarrow = admin({ id: "c", branchAccess: [] });
  assert.equal(pickOwnerSuccessor([inactiveWide, blockedWide, healthyNarrow]), healthyNarrow);
});

test("the input array is not mutated by ranking", () => {
  const wide = admin({ id: "a", branchAccess: ["s2", "s3"] });
  const narrow = admin({ id: "b", branchAccess: [] });
  const input = [wide, narrow];
  pickOwnerSuccessor(input);
  assert.deepEqual(input.map((u) => u.id), ["a", "b"]);
});