import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import {
  MdFeaturedPlayList, MdPayments, MdDashboardCustomize, MdOutlineSystemUpdateAlt,
  MdExpandMore, MdChevronRight
} from "react-icons/md";
import { BsPerson } from "react-icons/bs";
import { AiOutlineLogout } from "react-icons/ai";
import { GrDocumentPerformance } from "react-icons/gr";

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [pagePerms, setPagePerms] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    employeeManagement: false,
    attendanceLeave: false,
    payrollCompensations: false,
    performance: false,
    talentManagement: false,
    userManagement: false,
    auditLog: false,
    documentManagement: false,
    ticketSystem: false,
  });

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/status`, { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) {
          setRole(data.user?.role);
          const pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
          setPagePerms(pp);
        }
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
      attendanceLeave: ['/attendance', '/leave-requests', '/holidays'].some(r => p.startsWith(r)),
      documentManagement: p.startsWith('/documents'),
      ticketSystem: p.startsWith('/tickets'),
      payrollCompensations: p.startsWith('/Salary'),
      performance: ['/EmployeeGoals', '/PerformanceReview'].some(r => p.startsWith(r)),
      talentManagement: ['/tms/upload-resume', '/tms/folders', '/tms/reports'].some(r => p.startsWith(r)),
      userManagement: p.startsWith('/tms/user-management'),
      auditLog: p.startsWith('/tms/audit'),
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

  // Detect if user is employee (not TMS user) or TMS user
  const isTmsUser = !!localStorage.getItem('tmsUser');

  // Employee-only visible pages (employees can only see their own data pages)
  const employeePages = ['dashboard', 'employees', 'my_profile', 'attendance_logs', 'leave_requests', 'salary', 'goals', 'performance_reviews', 'submit_ticket', 'documents'];

  // Page permission check
  const builtInRoles = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD', 'GENERAL_USER', 'TEAM_LEAD', 'EMPLOYEE'];
  const isBuiltInRole = builtInRoles.includes(role);
  const hasPagePerms = Object.keys(pagePerms).length > 0;

  const canSee = (pageKey) => {
    // Employees (non-TMS users): only show restricted set of pages
    if (!isTmsUser) {
      return employeePages.includes(pageKey);
    }
    // TMS users: SUPER_ADMIN sees all, otherwise check page permissions
    if (role === 'SUPER_ADMIN') return true;
    if (isBuiltInRole && !hasPagePerms) return true;
    return !!pagePerms[pageKey];
  };

  // Show popup for custom roles (TMS users) with no permissions configured
  const showNoAccessPopup = isTmsUser && role && !isBuiltInRole && !hasPagePerms;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">HR</div>
        <span className="sidebar-title">HR CORE</span>
      </div>

      <ul className="sidebar-menu">

        {/* Dashboard */}
        {canSee('dashboard') && (
        <li className={`menu-item${isActive('/dashboard') ? ' active' : ''}`}>
          <Link to="/dashboard">
            <MdDashboardCustomize className="menu-icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        )}

        <li className="menu-divider"><span>MODULES</span></li>

        {/* Employee Management */}
        {(canSee('employees') || canSee('departments') || canSee('my_profile')) && (
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
              {canSee('employees') && (
              <li className={`submenu-item${isActive('/EmployeeList') ? ' active' : ''}`}>
                <Link to="/EmployeeList">Employees</Link>
              </li>
              )}
              {canSee('departments') && (
                <li className={`submenu-item${isActive('/departments') ? ' active' : ''}`}>
                  <Link to="/departments">Departments</Link>
                </li>
              )}
              {canSee('my_profile') && (
              <li className={`submenu-item${isActive('/AdminProfile') ? ' active' : ''}`}>
                <Link to="/AdminProfile">My Profile</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Attendance & Leave */}
        {(canSee('attendance_logs') || canSee('leave_requests') || canSee('holidays')) && (
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
              {canSee('attendance_logs') && (
              <li className={`submenu-item${isActive('/attendance') ? ' active' : ''}`}>
                <Link to="/attendance">Attendance Logs</Link>
              </li>
              )}
              {canSee('leave_requests') && (
              <li className={`submenu-item${isActive('/leave-requests') ? ' active' : ''}`}>
                <Link to="/leave-requests">Leave Requests</Link>
              </li>
              )}
              {canSee('holidays') && (
              <li className={`submenu-item${isActive('/holidays') ? ' active' : ''}`}>
                <Link to="/holidays">Holidays</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Payroll & Compensation */}
        {canSee('salary') && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/Salary') ? ' section-active' : ''}`}
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
              {canSee('salary') && (
                <li className={`submenu-item${isActive('/Salary') ? ' active' : ''}`}>
                  <Link to="/Salary">Salary Management</Link>
                </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Performance */}
        {(canSee('goals') || canSee('performance_reviews')) && (
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
              {canSee('goals') && (
              <li className={`submenu-item${isActive('/EmployeeGoals') ? ' active' : ''}`}>
                <Link to="/EmployeeGoals">Goals</Link>
              </li>
              )}
              {canSee('performance_reviews') && (
              <li className={`submenu-item${isActive('/PerformanceReview') ? ' active' : ''}`}>
                <Link to="/PerformanceReview">Performance Reviews</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Talent Management */}
        {(canSee('tms_upload_resume') || canSee('tms_folders') || canSee('tms_reports')) && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/tms') ? ' section-active' : ''}`}
            onClick={() => toggleSection("talentManagement")}
          >
            <MdPayments className="menu-icon" />
            <span>Talent Management</span>
            {expandedSections.talentManagement
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.talentManagement && (
            <ul className="submenu">
              {canSee('tms_upload_resume') && (
              <li className={`submenu-item${isActive('/tms/upload-resume') ? ' active' : ''}`}>
                <Link to="/tms/upload-resume">Upload Resume</Link>
              </li>
              )}
              {canSee('tms_folders') && (
              <li className={`submenu-item${isActive('/tms/folders') ? ' active' : ''}`}>
                <Link to="/tms/folders">Talent Management</Link>
              </li>
              )}
              {canSee('tms_reports') && (
              <li className={`submenu-item${isActive('/tms/reports') ? ' active' : ''}`}>
                <Link to="/tms/reports">TMS Reports</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* User Management */}
        {canSee('tms_user_management') && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/tms/user-management') ? ' section-active' : ''}`}
            onClick={() => toggleSection("userManagement")}
          >
            <BsPerson className="menu-icon" />
            <span>User Management</span>
            {expandedSections.userManagement
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.userManagement && (
            <ul className="submenu">
              <li className={`submenu-item${isActive('/tms/user-management') ? ' active' : ''}`}>
                <Link to="/tms/user-management">Users & Roles</Link>
              </li>
            </ul>
          )}
        </li>
        )}

        {/* Audit Log */}
        {canSee('tms_audit') && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/tms/audit') ? ' section-active' : ''}`}
            onClick={() => toggleSection("auditLog")}
          >
            <MdFeaturedPlayList className="menu-icon" />
            <span>Audit Log</span>
            {expandedSections.auditLog
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.auditLog && (
            <ul className="submenu">
              <li className={`submenu-item${isActive('/tms/audit') ? ' active' : ''}`}>
                <Link to="/tms/audit">Activity Log</Link>
              </li>
            </ul>
          )}
        </li>
        )}

        {/* Document Management */}
        {canSee('documents') && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/documents') ? ' section-active' : ''}`}
            onClick={() => toggleSection("documentManagement")}
          >
            <MdFeaturedPlayList className="menu-icon" />
            <span>Document Management</span>
            {expandedSections.documentManagement
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.documentManagement && (
            <ul className="submenu">
              {canSee('documents') && (
              <li className={`submenu-item${isActive('/documents') && !isActive('/documents/permissions') ? ' active' : ''}`}>
                <Link to="/documents">Documents</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Ticket System */}
        {(canSee('submit_ticket') || canSee('all_tickets') || canSee('ticket_categories') || canSee('ticket_reports')) && (
        <li className="menu-section">
          <div
            className={`menu-section-header${sectionActive('/tickets') ? ' section-active' : ''}`}
            onClick={() => toggleSection("ticketSystem")}
          >
            <MdFeaturedPlayList className="menu-icon" />
            <span>Ticket System</span>
            {expandedSections.ticketSystem
              ? <MdExpandMore className="chevron" />
              : <MdChevronRight className="chevron" />}
          </div>
          {expandedSections.ticketSystem && (
            <ul className="submenu">
              {canSee('submit_ticket') && (
              <li className={`submenu-item${isActive('/tickets/submit') ? ' active' : ''}`}>
                <Link to="/tickets/submit">Submit Ticket</Link>
              </li>
              )}
              {canSee('all_tickets') && (
              <li className={`submenu-item${isActive('/tickets') && !isActive('/tickets/submit') && !isActive('/tickets/categories') && !isActive('/tickets/reports') && !isActive('/tickets/permissions') ? ' active' : ''}`}>
                <Link to="/tickets">All Tickets</Link>
              </li>
              )}
              {canSee('ticket_categories') && (
              <li className={`submenu-item${isActive('/tickets/categories') ? ' active' : ''}`}>
                <Link to="/tickets/categories">Categories</Link>
              </li>
              )}
              {canSee('ticket_reports') && (
              <li className={`submenu-item${isActive('/tickets/reports') ? ' active' : ''}`}>
                <Link to="/tickets/reports">Reports</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Event Ticker */}
        {canSee('event_ticker') && (
          <li className={`menu-item${isActive('/event-ticker') ? ' active' : ''}`}>
            <Link to="/event-ticker">
              <MdFeaturedPlayList className="menu-icon" />
              <span>Event Ticker</span>
            </Link>
          </li>
        )}

        {/* Permission Management — Super Admin only */}
        {canSee('page_permissions') && (
          <li className={`menu-item${isActive('/page-permissions') ? ' active' : ''}`}>
            <Link to="/page-permissions">
              <MdOutlineSystemUpdateAlt className="menu-icon" />
              <span>Permission Management</span>
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

      {/* No Access Popup for custom roles with no permissions */}
      {showNoAccessPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1e293b', borderRadius: '16px', padding: '40px 48px',
            maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: '#f1f5f9', margin: '0 0 12px', fontSize: '22px' }}>No Access</h2>
            <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: '15px', lineHeight: '1.6' }}>
              You cannot access any modules because the administrator has not assigned permissions to your role yet. Please contact your administrator to get access.
            </p>
            <button
              onClick={handleLogoutClick}
              style={{
                padding: '10px 32px', borderRadius: '8px', border: 'none',
                background: '#0C3D4A', color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
