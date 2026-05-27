import type { Ticket } from "../../lib/types";
import { formatEnum } from "../../lib/format";

type StatusBadgeProps =
  | {
      kind: "status";
      value: Ticket["status"];
    }
  | {
      kind: "priority";
      value: Ticket["priority"];
    };

export function StatusBadge(props: StatusBadgeProps) {
  const tone = props.kind === "status" ? statusTone(props.value) : priorityTone(props.value);

  return <span className={`badge-soft ${tone}`}>{formatEnum(props.value)}</span>;
}

function statusTone(status: Ticket["status"]) {
  switch (status) {
    case "OPEN":
      return "badge-status-open";
    case "IN_PROGRESS":
      return "badge-status-progress";
    case "RESOLVED":
      return "badge-status-resolved";
    case "CLOSED":
      return "badge-status-closed";
    default:
      return "badge-status-default";
  }
}

function priorityTone(priority: Ticket["priority"]) {
  switch (priority) {
    case "HIGH":
      return "badge-priority-high";
    case "MEDIUM":
      return "badge-priority-medium";
    case "LOW":
      return "badge-priority-low";
    default:
      return "badge-status-default";
  }
}
