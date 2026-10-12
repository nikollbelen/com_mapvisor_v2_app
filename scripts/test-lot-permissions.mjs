import assert from "node:assert/strict";
import { isLotOwner } from "../src/utils/lotPermissions.ts";

const creator = { id: "creator" };
const visitor = { id: "visitor" };
for (const lot of [
  { id: "lot-1", owner_user_id: "creator" },
  { id: "lot-1", ownerId: "creator" },
]) {
  assert.equal(isLotOwner(creator, lot), true, "Creator can manage their lot");
  assert.equal(isLotOwner(visitor, lot), false, "Other users cannot manage the lot");
  assert.equal(isLotOwner(null, lot), false, "Signed-out users cannot manage the lot");
}
for (const lot of [null, {}, { id: "lot-1" }, { id: "lot-1", ownerId: "" }, { ownerId: "creator" }]) {
  assert.equal(isLotOwner(creator, lot), false, "Missing ownership or lot ID denies access");
}
assert.equal(isLotOwner({ id: "" }, { id: "lot-1", ownerId: "" }), false);
assert.equal(isLotOwner(creator, { id: "lot-1", owner_user_id: "visitor", ownerId: "creator" }), false,
  "Server ownership takes precedence over a conflicting local value");
console.log("Lot permissions: all checks passed.");
