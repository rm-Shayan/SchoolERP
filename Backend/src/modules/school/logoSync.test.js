import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBranchLogoReplace } from "./logoSync.js";

// ── Fixtures ────────────────────────────────────────────────────────────────
const CLOUD = "https://res.cloudinary.com/demo/image/upload";
// Different assets (different public_id / basename)
const branchOld = `${CLOUD}/v100/school-erp/school-logos/b1.webp`;
const newOtherAsset = `${CLOUD}/v101/school-erp/school-logos/b3.webp`;
const orgOld = `${CLOUD}/v100/school-erp/org-logos/o1.webp`;
// Same asset as branchOld, but a newer version — models the overwrite strategy:
// the upload reused the branch's public_id, so the old file must NOT be deleted.
const newSameAsset = `${CLOUD}/v101/school-erp/school-logos/b1.webp`;

// Fake for the real storageService.hasSamePublicId — same Cloudinary asset
// means the same file basename (public_id's last segment).
const sameAsset = (a, b) =>
  Boolean(
    a?.includes("res.cloudinary.com") &&
      b?.includes("res.cloudinary.com") &&
      a.split("/").pop().split(".")[0] === b.split("/").pop().split(".")[0]
  );

/** In-memory harness: records deletes + countBranches calls, injects fakes. */
function makeHarness(branchCount = 1) {
  const deletes = [];
  let countCalls = 0;
  return {
    deletes,
    countCalls: () => countCalls,
    setBranchCount: (n) => {
      branchCount = n;
    },
    run: (school, newLogoUrl) =>
      resolveBranchLogoReplace({
        school,
        newLogoUrl,
        countBranches: async () => {
          countCalls += 1;
          return branchCount;
        },
        deleteImage: async (url) => {
          deletes.push(url);
        },
        hasSamePublicId: sameAsset,
      }),
  };
}

function school(overrides = {}) {
  return {
    id: "school-1",
    logoUrl: null,
    organization: { id: "org-1", logoUrl: null },
    ...overrides,
  };
}

// ── Case A: org has exactly ONE branch → org image syncs ───────────────────
test("Case A (1 branch): branch with no logo uploads one → org syncs, nothing deleted", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(school(), newOtherAsset);

  assert.equal(orgImageSync, newOtherAsset);
  assert.deepEqual(h.deletes, []);
});

test("Case A (1 branch): replacing an existing branch logo also replaces + deletes the old org logo", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(
    school({ logoUrl: branchOld, organization: { id: "org-1", logoUrl: orgOld } }),
    newOtherAsset
  );

  assert.equal(orgImageSync, newOtherAsset);
  assert.deepEqual(h.deletes.sort(), [branchOld, orgOld].sort());
});

test("Case A (1 branch): replacing the logo when the org has no logo only deletes the old branch image", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(school({ logoUrl: branchOld }), newOtherAsset);

  assert.equal(orgImageSync, newOtherAsset);
  assert.deepEqual(h.deletes, [branchOld]);
});

test("Case A (1 branch): overwrite of the same asset → no deletes, org still synced", async () => {
  const h = makeHarness(1);
  // Branch and org were in sync (both b1). The new upload reused b1's
  // public_id (new version) — deleting either the branch or org copy would
  // wipe the just-uploaded replacement, so neither may be deleted.
  const { orgImageSync } = await h.run(
    school({ logoUrl: branchOld, organization: { id: "org-1", logoUrl: branchOld } }),
    newSameAsset
  );

  assert.equal(orgImageSync, newSameAsset);
  assert.deepEqual(h.deletes, []);
});

test("Case A (1 branch): org logo already equals the new logo → no delete, no sync needed", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(
    school({ logoUrl: branchOld, organization: { id: "org-1", logoUrl: newOtherAsset } }),
    newOtherAsset
  );

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, [branchOld]);
});

// ── Case B: org has 2+ branches → org image untouched ──────────────────────
test("Case B (2 branches): branch logo replaced → old branch image deleted, org untouched", async () => {
  const h = makeHarness(2);
  const { orgImageSync } = await h.run(
    school({ logoUrl: branchOld, organization: { id: "org-1", logoUrl: orgOld } }),
    newOtherAsset
  );

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, [branchOld]);
});

test("Case B (2 branches): branch with no logo uploads one → nothing deleted, org untouched", async () => {
  const h = makeHarness(2);
  const { orgImageSync } = await h.run(school(), newOtherAsset);

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, []);
});

test("Case B (many branches): same rule holds for 5 branches", async () => {
  const h = makeHarness(5);
  const { orgImageSync } = await h.run(school({ logoUrl: branchOld }), newOtherAsset);

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, [branchOld]);
});

// ── Branch logo removal (null) ─────────────────────────────────────────────
test("removing the branch logo deletes the old image but never touches the org image", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(
    school({ logoUrl: branchOld, organization: { id: "org-1", logoUrl: orgOld } }),
    null
  );

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, [branchOld]);
  assert.equal(h.countCalls(), 0, "countBranches must not run when the logo is being removed");
});

// ── No-ops / guards ────────────────────────────────────────────────────────
test("unchanged logo (same URL) → no deletes, no sync, branch count not queried", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(school({ logoUrl: branchOld }), branchOld);

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, []);
  assert.equal(h.countCalls(), 0);
});

test("logoUrl not provided (undefined) → no deletes, no sync, branch count not queried", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(school({ logoUrl: branchOld }), undefined);

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, []);
  assert.equal(h.countCalls(), 0);
});

test("missing organization relation → branch logo still cleaned up, no sync", async () => {
  const h = makeHarness(1);
  const { orgImageSync } = await h.run(school({ logoUrl: branchOld, organization: null }), newOtherAsset);

  assert.equal(orgImageSync, null);
  assert.deepEqual(h.deletes, [branchOld]);
});
