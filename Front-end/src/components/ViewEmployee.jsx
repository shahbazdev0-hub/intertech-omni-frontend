import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ViewEmployee.css';

const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // Check role — GENERAL_USER may only view their own profile
        const authRes = await fetch('http://localhost:5000/auth/status', { credentials: 'include' });
        const authData = await authRes.json();
        if (!authData.loggedIn) return navigate('/login');

        if (authData.user?.role === 'GENERAL_USER' && String(authData.user.id) !== String(id)) {
          // Redirect to their own profile page instead
          navigate('/AdminProfile', { replace: true });
          return;
        }

        const res = await fetch(`http://localhost:5000/api/employees/${id}`, { credentials: 'include' });
        if (res.status === 401) return navigate('/login');
        if (res.status === 403) {
          navigate('/AdminProfile', { replace: true });
          return;
        }
        if (res.status === 404) return setError('Employee not found.');
        if (!res.ok) throw new Error('Failed to fetch employee');
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
  if (!employee) return null;

  return (
    <div className="view-employee-container">
      <button
        onClick={() => navigate('/EmployeeList')}
        style={{ marginBottom: '1rem', padding: '0.4rem 1rem', cursor: 'pointer' }}
      >
        ← Back
      </button>

      <h2 className="view-employee-title">Employee Profile</h2>

      {/* Basic Information */}
      <div className="employee-card basic-info-card">
        <div className="employee-photo-section">
          <div className="employee-photo">
            <div className="default-avatar">
              <svg className="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="employee-details">
          <h3 className="card-title">Basic Information</h3>
          <div className="employee-row">
            <span className="label">Name:</span>
            <span className="value">{employee.name}</span>
          </div>
          <div className="employee-row">
            <span className="label">Employee ID:</span>
            <span className="value">{employee.id}</span>
          </div>
          <div className="employee-row">
            <span className="label">Department:</span>
            <span className="value">{employee.department?.name || 'N/A'}</span>
          </div>
          <div className="employee-row">
            <span className="label">Position:</span>
            <span className="value">{employee.position}</span>
          </div>
          <div className="employee-row">
            <span className="label">Joining Date:</span>
            <span className="value">{employee.joinDate?.split('T')[0] || 'N/A'}</span>
          </div>
          <div className="employee-row">
            <span className="label">Status:</span>
            <span className="value">{employee.status}</span>
          </div>
          <div className="employee-row">
            <span className="label">Role:</span>
            <span className="value">{employee.role}</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="employee-card contact-card">
        <h3 className="card-title">Contact Information</h3>
        <div className="employee-row">
          <span className="label">Email:</span>
          <span className="value">{employee.email}</span>
        </div>
      </div>

      {/* Professional Details */}
      <div className="employee-card experience-card">
        <h3 className="card-title">Professional Details</h3>
        <div className="employee-row">
          <span className="label">Age:</span>
          <span className="value">{employee.age}</span>
        </div>
        <div className="employee-row">
          <span className="label">Years of Experience:</span>
          <span className="value">{employee.experience}</span>
        </div>
        <div className="employee-row">
          <span className="label">Salary:</span>
          <span className="value">${employee.salary?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;
