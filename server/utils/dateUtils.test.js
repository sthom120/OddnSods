const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addRecurrenceToDateKey,
  dateKeyToDate,
  getDateKeyFromValue,
  getTodayDateKey,
} = require("./dateUtils");

test("keeps a date-only input as the same calendar date", () => {
  assert.equal(
    getDateKeyFromValue("2026-09-29"),
    "2026-09-29"
  );
});

test("uses the configured local day instead of UTC day", () => {
  const instant = new Date(
    "2026-09-28T14:00:00.000Z"
  );

  assert.equal(
    getTodayDateKey(
      instant,
      "Australia/Brisbane"
    ),
    "2026-09-29"
  );
});

test("monthly recurrence clamps to the last day of shorter months", () => {
  assert.equal(
    addRecurrenceToDateKey(
      "2026-01-31",
      "monthly"
    ),
    "2026-02-28"
  );

  assert.equal(
    addRecurrenceToDateKey(
      "2028-01-31",
      "monthly"
    ),
    "2028-02-29"
  );
});

test("date keys convert to UTC midnight dates without changing the day", () => {
  assert.equal(
    dateKeyToDate(
      "2026-09-29"
    ).toISOString(),
    "2026-09-29T00:00:00.000Z"
  );
});
