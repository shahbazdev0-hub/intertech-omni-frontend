// Components/DashboardHome.jsx
import React from "react";
import "./Dashboard.css";

const DashboardHome = () => {
  return (
    <div className="main-content">
      <header className="dashboard-header">
        <h2>Human Resource Management System</h2>
      </header>

      <div className="cards-container">
        <div className="dashboard-card">
          <h3>Total Employees</h3>
          <p>150</p>
        </div>

        <div className="dashboard-card">
          <h3>Active Projects</h3>
          <p>12</p>
        </div>

        <div className="dashboard-card">
          <h3>Departments</h3>
          <p>5</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
