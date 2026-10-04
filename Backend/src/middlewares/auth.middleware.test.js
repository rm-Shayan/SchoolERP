import { test } from "node:test";
import assert from "node:assert/strict";
import { scopePortalToChild } from "./auth.middleware.js";

// Parent whose two children sit in DIFFERENT branches. This is the case that
// broke: schoolId used to stay on children[0], so every school-scoped read
// (circulars, notices, exam sheets, PTM, study materials) kept showing the first
// child's branch after switching to the second child.
const ORG = "org-1";
const childA = { id: "stu-a", sectionId: "sec-a", schoolId: "br-a", school: { organizationId: ORG } };
const childB = { id: "stu-b", sectionId: "sec-b", schoolId: "br-b", school: { organizationId: ORG } };

const portal = () => ({
  type: "parent",
  id: "par-1",
  name: "Parent",
  children: [childA, childB],
  // Pre-scoping values: derived from children[0].
  schoolId: "br-a",
  organizationId: ORG,
  sectionIds: ["sec-a", "sec-b"],
  studentIds: ["stu-a", "stu-b"],
});

test("scopePortalToChild switches schoolId to the selected child's branch", () => {
  assert.equal(scopePortalToChild(portal(), childB).schoolId, "br-b");
  assert.equal(scopePortalToChild(portal(), childA).schoolId, "br-a");
});

test("scopePortalToChild narrows studentIds, sectionIds and children", () => {
  const s = scopePortalToChild(portal(), childB);
  assert.deepEqual(s.studentIds, ["stu-b"]);
  assert.deepEqual(s.sectionIds, ["sec-b"]);
  assert.deepEqual(s.children, [childB]);
});

test("scopePortalToChild keeps identity fields untouched", () => {
  const s = scopePortalToChild(portal(), childB);
  assert.equal(s.type, "parent");
  assert.equal(s.id, "par-1");
  assert.equal(s.organizationId, ORG);
});

test("scopePortalToChild tolerates a child with no section", () => {
  const s = scopePortalToChild(portal(), { id: "stu-c", sectionId: null, schoolId: "br-c", school: { organizationId: ORG } });
  assert.deepEqual(s.sectionIds, []);
  assert.equal(s.schoolId, "br-c");
});

test("scopePortalToChild does not mutate the original portal", () => {
  const before = portal();
  scopePortalToChild(before, childB);
  assert.equal(before.schoolId, "br-a");
  assert.deepEqual(before.studentIds, ["stu-a", "stu-b"]);
});