const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getDateKeyFromValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const datePart = value.slice(0, 10);

    if (DATE_KEY_PATTERN.test(datePart)) {
      return datePart;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const getTodayDateKey = (
  now = new Date(),
  timeZone =
    process.env.APP_TIME_ZONE ||
    "Australia/Brisbane"
) => {
  try {
    const parts = new Intl.DateTimeFormat(
      "en-AU",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(now);

    const values = Object.fromEntries(
      parts
        .filter((part) =>
          ["year", "month", "day"].includes(
            part.type
          )
        )
        .map((part) => [
          part.type,
          part.value,
        ])
    );

    return `${values.year}-${values.month}-${values.day}`;
  } catch (error) {
    console.warn(
      `Invalid APP_TIME_ZONE, falling back to UTC: ${timeZone}`
    );

    return now.toISOString().slice(0, 10);
  }
};

const addRecurrenceToDateKey = (
  dateKey,
  frequency
) => {
  if (
    !DATE_KEY_PATTERN.test(dateKey || "")
  ) {
    return null;
  }

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  switch (frequency) {
    case "daily":
      date.setUTCDate(
        date.getUTCDate() + 1
      );
      break;

    case "weekly":
      date.setUTCDate(
        date.getUTCDate() + 7
      );
      break;

    case "fortnightly":
      date.setUTCDate(
        date.getUTCDate() + 14
      );
      break;

    case "monthly": {
      const originalDay =
        date.getUTCDate();

      date.setUTCDate(1);
      date.setUTCMonth(
        date.getUTCMonth() + 1
      );

      const lastDayOfMonth =
        new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            0
          )
        ).getUTCDate();

      date.setUTCDate(
        Math.min(
          originalDay,
          lastDayOfMonth
        )
      );

      break;
    }

    default:
      return null;
  }

  return date.toISOString().slice(0, 10);
};

const dateKeyToDate = (dateKey) => {
  if (
    !DATE_KEY_PATTERN.test(dateKey || "")
  ) {
    return null;
  }

  return new Date(
    `${dateKey}T00:00:00.000Z`
  );
};

module.exports = {
  addRecurrenceToDateKey,
  dateKeyToDate,
  getDateKeyFromValue,
  getTodayDateKey,
};
