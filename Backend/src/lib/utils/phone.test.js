import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePkPhone, toNormalizedPhone, requirePkPhone } from "./phone.js";

test("normalizePkPhone collapses every PK input variant to one E.164 form", () => {
  const canonical = "923001234567";
  const variants = [
    "03001234567",
    "+923001234567",
    "923001234567",
    "00923001234567",
    "0300-123-4567",
    "+92 300 1234567",
    "+92 300-123-4567",
    "0300 123 4567",
    "3001234567",
    "  +92 300 1234567  ",
  ];

  for (const input of variants) {
    assert.equal(normalizePkPhone(input), canonical, `expected ${JSON.stringify(input)} -> ${canonical}`);
  }
});

test("normalizePkPhone returns null for anything that is not a PK mobile", () => {
  const invalid = ["", "   ", null, undefined, "abc", "12345", "01234567890", "0300123", "92300123456", "123001234567"];

  for (const input of invalid) {
    assert.equal(normalizePkPhone(input), null, `expected ${JSON.stringify(input)} -> null`);
  }
});

test("normalize is idempotent — normalizing twice equals normalizing once", () => {
  const once = normalizePkPhone("03001234567");
  assert.equal(normalizePkPhone(once), once);
});

test("formats that only differ by punctuation map to the same parent identity", () => {
  const a = normalizePkPhone("03001234567");
  const b = normalizePkPhone("+92 300 1234567");
  assert.equal(a, b, "duplicate detection depends on this");
});

test("toNormalizedPhone passes through empty values as null", () => {
  assert.equal(toNormalizedPhone(null), null);
  assert.equal(toNormalizedPhone(""), null);
  assert.equal(toNormalizedPhone("03001234567"), "923001234567");
});

test("requirePkPhone throws on invalid input instead of returning null", () => {
  assert.throws(() => requirePkPhone("not-a-phone"), /valid Pakistani mobile/);
  assert.equal(requirePkPhone("03001234567"), "923001234567");
});
