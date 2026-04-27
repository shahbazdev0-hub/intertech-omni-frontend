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
  const [isTmsUser, setIsTmsUser] = useState(false);
  const [tmsPerms, setTmsPerms] = useState([]);
  const [ticketPerms, setTicketPerms] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    employeeManagement: false,
    attendanceLeave: false,
    payrollCompensations: false,
    performance: false,
    talentManagement: false,
    ticketSystem: false,
  });

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/status", { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) {
          setRole(data.user?.role);
          setIsTmsUser(!!data.user?.isTmsUser);
          // Load TMS permissions from localStorage
          const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
          setTmsPerms(perms);
          // Load ticket permissions from localStorage
          const tPerms = JSON.parse(localStorage.getItem('ticketPermissions') || '[]');
          setTicketPerms(tPerms);
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
      attendanceLeave: ['/attendance', '/leave-requests', '/shifts'].some(r => p.startsWith(r)),
      ticketSystem: p.startsWith('/tickets'),
      payrollCompensations: ['/Salary', '/overtime', '/payroll-permissions'].some(r => p.startsWith(r)),
      performance: ['/EmployeeGoals', '/PerformanceReview'].some(r => p.startsWith(r)),
      talentManagement: p.startsWith('/tms'),
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

  // TMS SUPER_ADMIN gets full access to all modules
  // IT_SUPPORT sees only Ticket System
  // Other TMS roles (HR_EXECUTIVE, HR_MANAGER, HOD) see only TMS features
  const isItSupport = role === 'IT_SUPPORT';
  const showEmployeeModules = !isTmsUser || role === 'SUPER_ADMIN';
  const showTmsModules = isTmsUser && !isItSupport;  // IT Support does NOT see TMS

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">HR</div>
        <span className="sidebar-title">HR CORE</span>
      </div>

      <ul className="sidebar-menu">

        {/* Dashboard */}
        {showEmployeeModules && (
        <li className={`menu-item${isActive('/dashboard') ? ' active' : ''}`}>
          <Link to="/dashboard">
            <MdDashboardCustomize className="menu-icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        )}

        <li className="menu-divider"><span>MODULES</span></li>

        {/* Employee Management */}
        {showEmployeeModules && (
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
        )}

        {/* Attendance & Leave */}
        {showEmployeeModules && (
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
        )}

        {/* Payroll & Compensation */}
        {showEmployeeModules && (() => {
          const pp = JSON.parse(localStorage.getItem('payrollPermissions') || '[]');
          const hasAnyPayroll = pp.length > 0;
          const canViewPayslip = pp.includes('VIEW_OWN_PAYSLIP') || pp.includes('VIEW_ALL_PAYSLIPS');
          const canCompute = pp.includes('COMPUTE_PAYROLL') || pp.includes('GENERATE_PAYROLL') || pp.includes('EXPORT_PAYROLL') || pp.includes('ADJUST_SALARY');
          const canViewOT = pp.includes('VIEW_OVERTIME');
          const canManagePerms = pp.includes('MANAGE_PAYROLL_PERMISSIONS');
          if (!hasAnyPayroll) return null;
          return (
          <li className="menu-section">
            <div
              className={`menu-section-header${sectionActive('/Salary', '/overtime', '/payroll-permissions') ? ' section-active' : ''}`}
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
                {canCompute && (
                  <li className={`submenu-item${isActive('/Salary') ? ' active' : ''}`}>
                    <Link to="/Salary">Salary Management</Link>
                  </li>
                )}
                {!canCompute && canViewPayslip && (
                  <li className={`submenu-item${isActive('/Salary') ? ' active' : ''}`}>
                    <Link to="/Salary">My Payslip</Link>
                  </li>
                )}
                {canViewOT && (
                  <li className={`submenu-item${isActive('/overtime') ? ' active' : ''}`}>
                    <Link to="/overtime">Overtime Tracking</Link>
                  </li>
                )}
                {canManagePerms && (
                  <li className={`submenu-item${isActive('/payroll-permissions') ? ' active' : ''}`}>
                    <Link to="/payroll-permissions">Payroll Permissions</Link>
                  </li>
                )}
              </ul>
            )}
          </li>
          );
        })()}

        {/* Performance */}
        {showEmployeeModules && (
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
        )}

{/* Talent Management */}
        {showTmsModules && tmsPerms.length > 0 && (
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
              {tmsPerms.includes('UPLOAD_RESUME') && (
              <li className={`submenu-item${isActive('/tms/upload-resume') ? ' active' : ''}`}>
                <Link to="/tms/upload-resume">Upload Resume</Link>
              </li>
              )}
              <li className={`submenu-item${isActive('/tms/folders') ? ' active' : ''}`}>
                <Link to="/tms/folders">Talent Management</Link>
              </li>
              {tmsPerms.includes('VIEW_REPORTS') && (
              <li className={`submenu-item${isActive('/tms/reports') ? ' active' : ''}`}>
                <Link to="/tms/reports">TMS Reports</Link>
              </li>
              )}
              {tmsPerms.includes('VIEW_AUDIT_LOG') && (
              <li className={`submenu-item${isActive('/tms/audit') ? ' active' : ''}`}>
                <Link to="/tms/audit">Audit Log</Link>
              </li>
              )}
              {(tmsPerms.includes('MANAGE_USERS') || tmsPerms.includes('RESET_PASSWORD') || tmsPerms.includes('MANAGE_DESIGNATIONS')) && (
              <li className={`submenu-item${isActive('/tms/user-management') ? ' active' : ''}`}>
                <Link to="/tms/user-management">User Management</Link>
              </li>
              )}
              {tmsPerms.includes('MANAGE_PERMISSIONS') && (
              <li className={`submenu-item${isActive('/tms/permissions') ? ' active' : ''}`}>
                <Link to="/tms/permissions">Permissions</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Ticket System */}
        {ticketPerms.length > 0 && (
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
              {ticketPerms.includes('SUBMIT_TICKET') && (
              <li className={`submenu-item${isActive('/tickets/submit') ? ' active' : ''}`}>
                <Link to="/tickets/submit">Submit Ticket</Link>
              </li>
              )}
              <li className={`submenu-item${isActive('/tickets') && !isActive('/tickets/submit') && !isActive('/tickets/categories') && !isActive('/tickets/reports') && !isActive('/tickets/permissions') ? ' active' : ''}`}>
                <Link to="/tickets">All Tickets</Link>
              </li>
              {ticketPerms.includes('MANAGE_CATEGORIES') && (
              <li className={`submenu-item${isActive('/tickets/categories') ? ' active' : ''}`}>
                <Link to="/tickets/categories">Categories</Link>
              </li>
              )}
              {ticketPerms.includes('VIEW_TICKET_REPORTS') && (
              <li className={`submenu-item${isActive('/tickets/reports') ? ' active' : ''}`}>
                <Link to="/tickets/reports">Reports</Link>
              </li>
              )}
              {ticketPerms.includes('MANAGE_TICKET_PERMISSIONS') && (
              <li className={`submenu-item${isActive('/tickets/permissions') ? ' active' : ''}`}>
                <Link to="/tickets/permissions">Permissions</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Reporting — Super Admin, Admin, HR */}
        {showEmployeeModules && ['SUPER_ADMIN','ADMIN','HR'].includes(role) && (
          <li className={`menu-item${isActive('/dashboard') ? ' active' : ''}`}>
            <Link to="/dashboard">
              <MdFeaturedPlayList className="menu-icon" />
              <span>Reports</span>
            </Link>
          </li>
        )}

        {/* System Settings — Super Admin only */}
        {showEmployeeModules && role === 'SUPER_ADMIN' && (
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
