const getDueNotificationRecipientIds = (
  list,
  assignedTo
) => {
  const ownerId = list?.owner?.toString?.();

  const memberIds = (
    list?.members || []
  )
    .map((member) =>
      member?.toString?.()
    )
    .filter(Boolean);

  const allowedIds = new Set(
    [ownerId, ...memberIds].filter(Boolean)
  );

  const assignedId =
    assignedTo?.toString?.();

  if (
    assignedId &&
    allowedIds.has(assignedId)
  ) {
    return [assignedId];
  }

  return [...allowedIds];
};

const getNotificationHour = (value) => {
  const parsed = Number.parseInt(
    value,
    10
  );

  if (
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= 23
  ) {
    return parsed;
  }

  return 9;
};

const getCheckIntervalMinutes = (
  value
) => {
  const parsed = Number.parseInt(
    value,
    10
  );

  if (
    Number.isInteger(parsed) &&
    parsed >= 1 &&
    parsed <= 60
  ) {
    return parsed;
  }

  return 15;
};

module.exports = {
  getCheckIntervalMinutes,
  getDueNotificationRecipientIds,
  getNotificationHour,
};
