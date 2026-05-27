export function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatRoleLabel(role: "CLIENT" | "AGENT" | "ADMIN" | string) {
  switch (role) {
    case "CLIENT":
      return "Client";
    case "AGENT":
      return "Agent";
    case "ADMIN":
      return "Admin";
    default:
      return formatEnum(role);
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCommentTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}
