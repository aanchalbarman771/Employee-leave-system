import React from "react";

const StatusBadge = ({ status }) => {
  let badgeClass = "status-badge ";
  let icon = "⏳";
  if (status === "Approved") {
    badgeClass += "status-approved";
    icon = "✅";
  } else if (status === "Rejected") {
    badgeClass += "status-rejected";
    icon = "❌";
  } else {
    badgeClass += "status-pending";
    icon = "⏳";
  }

  return (
    <span className={badgeClass}>
      <span>{icon}</span> {status}
    </span>
  );
};

export default StatusBadge;
