import React from "react";

const StatusBadge = ({ status }) => {
  let badgeClass = "status-badge ";
  if (status === "Approved") badgeClass += "status-approved";
  else if (status === "Rejected") badgeClass += "status-rejected";
  else badgeClass += "status-pending";

  return <span className={badgeClass}>{status}</span>;
};

export default StatusBadge;
