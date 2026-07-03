import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import Sidebar from './components/Sidebar';
import EmployeeListPage from './components/EmployeeList';
import Profile from './components/ViewEmployee';
import EmployeeGoals from './components/EmployeeGoals';
import PerformanceReview from './components/PerformanceReview';
import LeaveRequests from './components/LeaveRequests';
import Salary from './components/Salary';
import AdminProfile from './components/MyProfile';
import ViewEmployee from './components/ViewEmployee';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import AttendanceLogs from './components/AttendanceLogs';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import Reporting from './components/Reporting';
import DashboardHome from './components/DashboardHome';
import SystemSettings from './components/SystemSettings';
import DepartmentManagement from './components/DepartmentManagement';
import TmsUploadResume from './components/TmsUploadResume';
import TmsFolders from './components/TmsFolders';
import TmsFolderDetail from './components/TmsFolderDetail';
import TmsReports from './components/TmsReports';
import TmsAuditLog from './components/TmsAuditLog';
import TmsUserManagement from './components/TmsUserManagement';
import TmsPermissions from './components/TmsPermissions';
import TicketSubmit from './components/TicketSubmit';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import TicketCategories from './components/TicketCategories';
import TicketReports from './components/TicketReports';
import TicketPermissions from './components/TicketPermissions';
import PayrollPermissions from './components/PayrollPermissions';
import DocumentManagement from './components/DocumentManagement';
import DocumentPermissions from './components/DocumentPermissions';
import EventTickerBar from './components/EventTickerBar';
import EventTickerManagement from './components/EventTickerManagement';
import HolidayManagement from './components/HolidayManagement';
import PagePermissions from './components/PagePermissions';
import './components/Tms.css';

const LayoutWithSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('tmsUser');
    localStorage.removeItem('tmsPermissions');
    localStorage.removeItem('ticketPermissions');
    localStorage.removeItem('payrollPermissions');
    localStorage.removeItem('documentPermissions');
    localStorage.removeItem('pagePermissions');
    localStorage.removeItem('valid');
    navigate('/');
  };

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />

      <div className="main-dashboard">
        <EventTickerBar />
        <div className="top-navigation">
          <div className="nav-links">
            <button className="nav-link logout-btn" onClick={() => navigate('/')}>
              Home
            </button>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contacts</Link>
            <button className="nav-link logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="main-content">
          <Routes>
            <Route path="/EmployeeList" element={<EmployeeListPage />} />
            <Route path="/employee/:id" element={<ViewEmployee />} />
            <Route path="/AdminProfile" element={<AdminProfile />} />
            <Route path="/EmployeeGoals" element={<EmployeeGoals />} />
            <Route path="/tms/upload-resume" element={<TmsUploadResume />} />
          <Route path="/tms/folders" element={<TmsFolders />} />
          <Route path="/tms/folders/:id" element={<TmsFolderDetail />} />
            <Route path="/tms/reports" element={<TmsReports />} />
          <Route path="/tms/audit" element={<TmsAuditLog />} />
          <Route path="/tms/user-management" element={<TmsUserManagement />} />
          <Route path="/tms/permissions" element={<TmsPermissions />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/attendance" element={<AttendanceLogs />} />
            <Route path="/PerformanceReview" element={<PerformanceReview />} />
            <Route path="/Salary" element={<Salary />} />
            <Route path="/departments" element={<DepartmentManagement />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/holidays" element={<HolidayManagement />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/submit" element={<TicketSubmit />} />
            <Route path="/tickets/categories" element={<TicketCategories />} />
            <Route path="/tickets/reports" element={<TicketReports />} />
            <Route path="/tickets/permissions" element={<TicketPermissions />} />
            <Route path="/payroll-permissions" element={<PayrollPermissions />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/documents/permissions" element={<DocumentPermissions />} />
            <Route path="/event-ticker" element={<EventTickerManagement />} />
            <Route path="/page-permissions" element={<PagePermissions />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/no-access" element={<div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}><h2>No Access</h2><p>You do not have permission to access any module. Please contact your administrator.</p></div>} />
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}><h2>404 — Page Not Found</h2></div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.loggedIn) {
        // Only redirect if user is not on a public page
        const publicPaths = ['/', '/login', '/about', '/contact'];
        if (!publicPaths.includes(location.pathname)) {
          navigate('/login');
        }
      }
      // If logged in, do nothing – stay on the page user clicked
    } catch (err) {
      console.error('Auth check failed:', err);
      const publicPaths = ['/', '/login', '/about', '/contact'];
      if (!publicPaths.includes(location.pathname)) {
        navigate('/login');
      }
    } finally {
      setCheckingAuth(false);
    }
  };

  checkAuth();
}, [location.pathname, navigate]);


  if (checkingAuth) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="*" element={<LayoutWithSidebar />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
