import React from "react";

const DashboardCard = ({ title, value, colorClass, icon }) => {
  return (
    <div className={`dashboard-card ${colorClass || ''}`}>
      <div className="card-top">
        <div className="card-header">{title}</div>
        {icon && <div className="card-icon">{icon}</div>}
      </div>
      <div className="card-value">{value}</div>
    </div>
  );
};

export default DashboardCard;
