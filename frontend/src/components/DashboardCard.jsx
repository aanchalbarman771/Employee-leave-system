import React from "react";

const DashboardCard = ({ title, value, colorClass, icon }) => {
  return (
    <div className={`dashboard-card ${colorClass || ''}`}>
      <div>
        <div className="card-header">{title}</div>
        <div className="card-value">{value}</div>
      </div>
      {icon && <div className="card-icon">{icon}</div>}
    </div>
  );
};

export default DashboardCard;
