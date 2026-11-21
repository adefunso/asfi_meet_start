// Formats an ISO timestamp as "November 20, 2026 11:00 AM" in Lagos time.
const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // toLocaleString renders "November 20, 2026 at 11:00 AM" for these options;
  // drop the "at" so the date and time stay together.
  return date.toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace(" at ", " ");
};

module.exports = formatDateTime;
