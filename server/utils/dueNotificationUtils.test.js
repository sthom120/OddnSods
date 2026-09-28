const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getCheckIntervalMinutes,
  getDueNotificationRecipientIds,
  getNotificationHour,
} = require(
  "./dueNotificationUtils"
);

test("assigned items notify only the valid assignee", () => {
  const list = {
    owner: "owner-1",
    members: [
      "member-1",
      "member-2",
    ],
  };

  assert.deepEqual(
    getDueNotificationRecipientIds(
      list,
      "member-2"
    ),
    ["member-2"]
  );
});

test("unassigned items notify everyone with list access", () => {
  const list = {
    owner: "owner-1",
    members: [
      "member-1",
      "member-2",
    ],
  };

  assert.deepEqual(
    getDueNotificationRecipientIds(
      list,
      null
    ),
    [
      "owner-1",
      "member-1",
      "member-2",
    ]
  );
});

test("invalid assignee falls back to everyone with access", () => {
  const list = {
    owner: "owner-1",
    members: ["member-1"],
  };

  assert.deepEqual(
    getDueNotificationRecipientIds(
      list,
      "former-member"
    ),
    ["owner-1", "member-1"]
  );
});

test("notification timing uses safe defaults", () => {
  assert.equal(
    getNotificationHour(undefined),
    9
  );

  assert.equal(
    getNotificationHour("18"),
    18
  );

  assert.equal(
    getNotificationHour("30"),
    9
  );

  assert.equal(
    getCheckIntervalMinutes(
      undefined
    ),
    15
  );

  assert.equal(
    getCheckIntervalMinutes("5"),
    5
  );
});
