import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import {
  MdFeaturedPlayList, MdPayments, MdDashboardCustomize, MdOutlineSystemUpdateAlt,
  MdExpandMore, MdChevronRight, MdSchedule
} from "react-icons/md";
import { BsPerson } from "react-icons/bs";
import { AiOutlineLogout } from "react-icons/ai";
import { GrDocumentPerformance } from "react-icons/gr";

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    employeeManagement: false,
    attendanceLeave: false,
    payrollCompensations: false,
    performance: false,
    talentManagement: false,
  });

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/status", { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) setRole(data.user?.role);
      } catch (err) {
        console.error("Failed to get role:", err);
      }
    };
    fetchRole();
  }, []);

  // Auto-expand the section that contains the current path
  useEffect(() => {
    const p = location.pathname;
    setExpandedSections(prev => ({
      ...prev,
      employeeManagement: ['/EmployeeList', '/departments', '/AdminProfile'].some(r => p.startsWith(r)) || p.startsWith('/employee/'),
      attendanceLeave: ['/attendance', '/leave-requests', '/shifts'].some(r => p.startsWith(r)),
      payrollCompensations: ['/Salary', '/overtime'].some(r => p.startsWith(r)),
      performance: ['/EmployeeGoals', '/PerformanceReview'].some(r => p.startsWith(r)),
      recruitment: ['/Candidates', '/JobPostings'].some(r => p.startsWith(r)),
    }));
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const sectionActive = (...paths) =>
    paths.some(p => location.pathname.startsWith(p));

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">HR</div>
        <span className="sidebar-title">HR CORE</span>
      </div>

      <ul className="sidebar-menu">

        {/* Dashboard */}
        <li className={`menu-item${isActive('/dashboard') ? ' active' : ''}`}>
          <Link to="/dashboard">
            <MdDashboardCustomize className="menu-icon" />
            <span>Dashboard</span>
          </Link>
        </li>

        <li className="menu-divider"><span>MODULES</span></li>

        {/* Employee Management */}
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/EmployeeList', '/departments', '/AdminProfile', '/employee/') ? ' section-active' : ''}`}
            onClick={() => toggleSection("employeeManagement")}
          >
            <BsPerson className="menu-icon" />
            <span>Employee Management</span>
            {expandedSections.employeeManagement
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.employeeManagement && (
            <ul className="submenu">
              <li className={`submenu-item${isActive('/EmployeeList') ? ' active' : ''}`}>
                <Link to="/EmployeeList">Employees</Link>
              </li>
              {['SUPER_ADMIN','ADMIN'].includes(role) && (
                <li className={`submenu-item${isActive('/departments') ? ' active' : ''}`}>
                  <Link to="/departments">Departments</Link>
                </li>
              )}
              <li className={`submenu-item${isActive('/AdminProfile') ? ' active' : ''}`}>
                <Link to="/AdminProfile">My Profile</Link>
              </li>
            </ul>
          )}
        </li>

        {/* Attendance & Leave */}
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/attendance', '/leave-requests', '/shifts') ? ' section-active' : ''}`}
            onClick={() => toggleSection("attendanceLeave")}
          >
            <MdFeaturedPlayList className="menu-icon" />
            <span>Attendance &amp; Leave</span>
            {expandedSections.attendanceLeave
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.attendanceLeave && (
            <ul className="submenu">
              <li className={`submenu-item${isActive('/attendance') ? ' active' : ''}`}>
                <Link to="/attendance">Attendance Logs</Link>
              </li>
              <li className={`submenu-item${isActive('/leave-requests') ? ' active' : ''}`}>
                <Link to="/leave-requests">Leave Requests</Link>
              </li>
              <li className={`submenu-item${isActive('/shifts') ? ' active' : ''}`}>
                <Link to="/shifts">
                  <MdSchedule style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Shift Management
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Payroll — hidden from GENERAL_USER */}
        {['SUPER_ADMIN','ADMIN','HR','HOD'].includes(role) && (
          <li className="menu-section">
            <div
              className={`menu-section-header${sectionActive('/Salary', '/overtime') ? ' section-active' : ''}`}
              onClick={() => toggleSection("payrollCompensations")}
            >
              <MdPayments className="menu-icon" />
              <span>Payroll &amp; Compensation</span>
              {expandedSections.payrollCompensations
                ? <MdExpandMore className="chevron" />
                : <MdChevronRight className="chevron" />}
            </div>
            {expandedSections.payrollCompensations && (
              <ul className="submenu">
                {['SUPER_ADMIN','ADMIN','HR'].includes(role) && (
                  <li className={`submenu-item${isActive('/Salary') ? ' active' : ''}`}>
                    <Link to="/Salary">Salary Management</Link>
                  </li>
                )}
                <li className={`submenu-item${isActive('/overtime') ? ' active' : ''}`}>
                  <Link to="/overtime">Overtime Tracking</Link>
                </li>
              </ul>
            )}
          </li>
        )}

        {/* Performance */}
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/EmployeeGoals', '/PerformanceReview') ? ' section-active' : ''}`}
            onClick={() => toggleSection("performance")}
          >
            <GrDocumentPerformance className="menu-icon" />
            <span>Performance</span>
            {expandedSections.performance
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.performance && (
            <ul className="submenu">
              <li className={`submenu-item${isActive('/EmployeeGoals') ? ' active' : ''}`}>
                <Link to="/EmployeeGoals">Goals</Link>
              </li>
              <li className={`submenu-item${isActive('/PerformanceReview') ? ' active' : ''}`}>
                <Link to="/PerformanceReview">Performance Reviews</Link>
              </li>
            </ul>
          )}
        </li>


{/* Talent Management */}
        {(() => {
          const tmsPerms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
          const hasTms = tmsPerms.length > 0;
          if (!hasTms) return null;
          return (
        <li className="menu-section">
          <div className="menu-section-header" onClick={() => toggleSection("talentManagement")}>
            <MdPayments style={{ marginRight: '13px', fontSize: '24px' }} />
             <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Talent Management</span>
             <i className={`bi bi-chevron-${expandedSections.talentManagement ? "down" : "right"} chevron`}></i>
           </div>
           {expandedSections.talentManagement && (
             <ul className="submenu">
               {tmsPerms.includes('UPLOAD_RESUME') && (
               <li className="submenu-item">
                 <Link to="/tms/upload-resume" style={{ textDecoration: 'none', color: 'inherit' }}>Upload Resume</Link>
              </li>
               )}
              <li className="submenu-item">
                <Link to="/tms/folders" style={{ textDecoration: 'none', color: 'inherit' }}>Talent Management</Link>
              </li>
              {tmsPerms.includes('VIEW_REPORTS') && (
              <li className="submenu-item">
                <Link to="/tms/reports" style={{ textDecoration: 'none', color: 'inherit' }}>TMS Reports</Link>
              </li>
              )}
              {tmsPerms.includes('VIEW_AUDIT_LOG') && (
              <li className="submenu-item">
                <Link to="/tms/audit" style={{ textDecoration: 'none', color: 'inherit' }}>Audit Log</Link>
              </li>
              )}
              {(tmsPerms.includes('MANAGE_USERS') || tmsPerms.includes('RESET_PASSWORD') || tmsPerms.includes('MANAGE_DESIGNATIONS')) && (
              <li className="submenu-item">
                <Link to="/tms/user-management" style={{ textDecoration: 'none', color: 'inherit' }}>User Management</Link>
              </li>
              )}
              {tmsPerms.includes('MANAGE_PERMISSIONS') && (
              <li className={`submenu-item${isActive('/JobPostings') ? ' active' : ''}`}>
                <Link to="/tms/permissions">Permissions</Link>
              </li>
                )}
          </ul>
          )}
        </li>
          );
        })()}

        {/* Reporting — Super Admin, Admin, HR */}
        {['SUPER_ADMIN','ADMIN','HR'].includes(role) && (
          <li className={`menu-item${isActive('/dashboard') ? ' active' : ''}`}>
            <Link to="/dashboard">
              <MdFeaturedPlayList className="menu-icon" />
              <span>Reports</span>
            </Link>
          </li>
        )}

        {/* System Settings — Super Admin only */}
        {role === 'SUPER_ADMIN' && (
          <li className={`menu-item${isActive('/settings') ? ' active' : ''}`}>
            <Link to="/settings">
              <MdOutlineSystemUpdateAlt className="menu-icon" />
              <span>System Settings</span>
            </Link>
          </li>
        )}

        <li className="menu-divider" />

        {/* Logout */}
        <li className="menu-item menu-item-logout" onClick={handleLogoutClick}>
          <AiOutlineLogout className="menu-icon" />
          <span>Logout</span>
        </li>

      </ul>
    </div>
  );
};

export default Sidebar;
