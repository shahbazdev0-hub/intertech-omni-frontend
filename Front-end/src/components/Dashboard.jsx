import React from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  axios.defaults.withCredentials = true;

  const handleLogout = () => {
    axios.get('http://localhost:3000/auth/logout')
      .then(result => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          window.location.href = '/';
        }
      });
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="main-content-wrapper">
        <Outlet /> {/* This will now load only the specific route content */}
      </div>
    </div>
  );
};

export default Dashboard;

