import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeStatus, statusMatchPattern, uniqueStatuses } from "../src/lib/shared/statuses";

describe("status filter options", () => {
  it("removes built-in and stored case/separator duplicates", () => {
    assert.deepEqual(uniqueStatuses([
      "active", "Active", "ACTIVE", "completed", "Completed",
      "on_hold", "On Hold", "On-hold", "In Progress", "in_progress"
    ]), ["active", "completed", "In Progress", "on_hold"]);
  });

  it("normalizes equivalent status values for cursor scope", () => {
    assert.equal(normalizeStatus("On_Hold"), normalizeStatus("on hold"));
    assert.equal(normalizeStatus("In-Progress"), normalizeStatus("in progress"));
  });

  it("matches case and separator variants without accepting partial labels", () => {
    const matchesOnHold = statusMatchPattern("on_hold");
    assert.equal(matchesOnHold.test("On Hold"), true);
    assert.equal(matchesOnHold.test("ON-HOLD"), true);
    assert.equal(matchesOnHold.test("on_hold"), true);
    assert.equal(matchesOnHold.test("On Hold Later"), false);
  });

  it("treats regex punctuation in custom statuses literally", () => {
    const matches = statusMatchPattern("Ready.+");
    assert.equal(matches.test("Ready.+"), true);
    assert.equal(matches.test("ReadyXYZ"), false);
  });
});
