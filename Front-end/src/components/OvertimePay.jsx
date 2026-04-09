import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Calendar, Filter, Clock, Users, TrendingUp, DollarSign, Menu, ChevronDown } from 'lucide-react';
import './OvertimePay.css';

const OvertimePay = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');
  
  // Backend data states
  const [overtimeData, setOvertimeData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [departments, setDepartments] = useState(['all']);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({ 
    totalEmployees: 0, 
    eligibleForOvertime: 0, 
    totalOvertimeHours: '0.0', 
    totalOvertimePay: '0.00' 
  });

  // OVERTIME CONFIGURATION
  const OVERTIME_CONFIG = {
    STANDARD_WORK_HOURS: 8, // Standard work day hours
    MAX_OVERTIME_HOURS: 4,  // Maximum overtime hours per day
    OVERTIME_RATE_MULTIPLIER: 1.5, // 1.5x regular hourly rate
    STANDARD_HOURLY_RATE: 25 // Default hourly rate (should come from employee data)
  };

  // Calculate overtime with proper logic using real salary data
  const calculateOvertimeData = (attendanceRecord, salaryData) => {
    const { totalHours = 0, employeeId } = attendanceRecord;
    
    // Find salary data for this employee
    const employeeSalary = salaryData.find(s => s.employeeId === employeeId);
    const baseSalary = employeeSalary ? parseFloat(employeeSalary.baseSalary) : 0;
    
    // Calculate hourly rate from monthly salary (assuming 160 working hours per month)
    const hourlyRate = baseSalary / 160;
    
    let regularHours = totalHours;
    let overtimeHours = 0;
    
    // If worked more than standard hours, calculate overtime
    if (totalHours > OVERTIME_CONFIG.STANDARD_WORK_HOURS) {
      regularHours = OVERTIME_CONFIG.STANDARD_WORK_HOURS;
      overtimeHours = Math.min(
        totalHours - OVERTIME_CONFIG.STANDARD_WORK_HOURS,
        OVERTIME_CONFIG.MAX_OVERTIME_HOURS
      );
    }
    
    const regularPay = (regularHours * hourlyRate).toFixed(2);
    const overtimePay = (overtimeHours * hourlyRate * OVERTIME_CONFIG.OVERTIME_RATE_MULTIPLIER).toFixed(2);
    const totalPay = (parseFloat(regularPay) + parseFloat(overtimePay)).toFixed(2);
    
    return {
      ...attendanceRecord,
      regularHours: regularHours.toFixed(1),
      overtimeHours: overtimeHours.toFixed(1),
      regularPay,
      overtimePay,
      totalPay,
      hourlyRate: hourlyRate.toFixed(2),
      baseSalary: baseSalary.toFixed(2)
    };
  };

  // Fetch departments for dropdown
  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/salaries/dropdown/departments', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const depts = ['all', ...result.data.map(dept => dept.name)];
          setDepartments(depts);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch current salary data for all employees
  const fetchSalaryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/salaries/current/all', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSalaryData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  // Fetch attendance logs with overtime calculations
  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      
      // Date range logic
      const today = new Date();
      if (dateRange === 'today') {
        params.append('startDate', today.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        params.append('startDate', yesterday.toISOString().split('T')[0]);
        params.append('endDate', yesterday.toISOString().split('T')[0]);
      } else if (dateRange === 'this_week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        params.append('startDate', weekStart.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      } else if (dateRange === 'last_week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() - 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        params.append('startDate', weekStart.toISOString().split('T')[0]);
        params.append('endDate', weekEnd.toISOString().split('T')[0]);
      } else if (dateRange === 'this_month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        params.append('startDate', monthStart.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      }

      // Fetch attendance logs instead of separate overtime endpoint
      const response = await fetch(`http://localhost:5000/api/attendance/logs?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filter only records with overtime (totalHours > 8)
          const attendanceWithOT = (result.logs || []).filter(record => record.totalHours > OVERTIME_CONFIG.STANDARD_WORK_HOURS);
          
          // Process data with proper overtime calculations using real salary data
          const processedData = attendanceWithOT.map(record => calculateOvertimeData(record, salaryData));
          setOvertimeData(processedData);
          
          // Calculate stats from processed data
          const totalOvertimeHours = processedData.reduce((sum, record) => sum + parseFloat(record.overtimeHours), 0);
          const totalOvertimePay = processedData.reduce((sum, record) => sum + parseFloat(record.overtimePay), 0);
          const employeesWithOT = processedData.filter(record => parseFloat(record.overtimeHours) > 0).length;
          
          setStats({
            totalEmployees: processedData.length,
            eligibleForOvertime: employeesWithOT,
            totalOvertimeHours: totalOvertimeHours.toFixed(1),
            totalOvertimePay: totalOvertimePay.toFixed(2)
          });
          setPagination(result.pagination || {});
        }
      }
    } catch (error) {
      console.error('Error fetching overtime data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchDepartments();
    fetchSalaryData();
  }, []);

  useEffect(() => {
    // Only fetch overtime data if salary data is available
    if (salaryData.length > 0) {
      fetchOvertimeData();
    }
  }, [selectedDepartment, dateRange, salaryData]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return overtimeData;
    
    return overtimeData.filter(record => {
      const employeeName = record.employeeName?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return employeeName.includes(search);
    });
  }, [overtimeData, searchTerm]);

  // Apply status filter with your new thresholds
  const statusFilteredData = useMemo(() => {
    if (selectedStatus === 'all') return filteredData;
    
    return filteredData.filter(record => {
      const overtimeHours = parseFloat(record.overtimeHours);
      if (selectedStatus === 'high' && overtimeHours > 2 && overtimeHours <= 4) return true;
      if (selectedStatus === 'medium' && overtimeHours > 1 && overtimeHours <= 2) return true;
      if (selectedStatus === 'low' && overtimeHours > 0 && overtimeHours <= 1) return true;
      return false;
    });
  }, [filteredData, selectedStatus]);

  // Updated overtime status logic based on your requirements
  const getOvertimeStatus = (overtimeHours) => {
    const hours = parseFloat(overtimeHours);
    if (hours > 2 && hours <= 4) return 'high';     // 2-4 hours = High
    if (hours > 1 && hours <= 2) return 'medium';   // 1-2 hours = Medium  
    if (hours > 0 && hours <= 1) return 'low';      // 0-1 hours = Low
    return 'none';
  };

  const getStatusBadge = (overtimeHours) => {
    const status = getOvertimeStatus(overtimeHours);
    const statusClasses = {
      high: 'overtime-status-high',
      medium: 'overtime-status-medium',
      low: 'overtime-status-low',
      none: 'overtime-status-none'
    };

    const statusLabels = {
      high: 'High OT',
      medium: 'Medium OT', 
      low: 'Low OT',
      none: 'No OT'
    };

    return (
      <span className={`overtime-status-badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '--:--';
    return new Date(dateTimeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString();
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Employee', 'Department', 'Clock In', 'Clock Out', 'Regular Hours', 'Overtime Hours', 'Hourly Rate ($)', 'Regular Pay ($)', 'Overtime Pay ($)', 'Total Pay ($)', 'Status'];
      const csvContent = [
        headers.join(','),
        ...statusFilteredData.map(record => [
          formatDate(record.date),
          record.employeeName,
          record.department,
          formatTime(record.checkInTime),
          formatTime(record.checkOutTime),
          record.regularHours,
          record.overtimeHours,
          record.hourlyRate,
          record.regularPay,
          record.overtimePay,
          record.totalPay,
          getOvertimeStatus(record.overtimeHours).toUpperCase()
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overtime_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  return (
    <div
      className="overtime-main-content"
      style={{
        marginLeft: "3.5cm",
      }}
    >
      {/* Page Title */}
      <div className="overtime-page-header">
        <h1 className="overtime-page-title">Overtime Pay Management</h1>
        <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
          Standard: 8hr work day | Max OT: 4hr/day | Rate: 1.5x regular pay
        </p>
      </div>

      <div className="overtime-container">
        {/* Stats Cards */}
        <div className="overtime-stats-grid">
          <div className="overtime-stat-card stat-blue">
            <div className="overtime-stat-content">
              <div className="overtime-stat-info">
                <Users className="overtime-stat-icon-main" />
                <div className="overtime-stat-details">
                  <p className="overtime-stat-title">Total Records</p>
                  <p className="overtime-stat-value">{stats.totalEmployees}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overtime-stat-card stat-green">
            <div className="overtime-stat-content">
              <div className="overtime-stat-info">
                <Clock className="overtime-stat-icon-main" />
                <div className="overtime-stat-details">
                  <p className="overtime-stat-title">Employees with OT</p>
                  <p className="overtime-stat-value">{stats.eligibleForOvertime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overtime-stat-card stat-yellow">
            <div className="overtime-stat-content">
              <div className="overtime-stat-info">
                <TrendingUp className="overtime-stat-icon-main" />
                <div className="overtime-stat-details">
                  <p className="overtime-stat-title">Total OT Hours</p>
                  <p className="overtime-stat-value">{stats.totalOvertimeHours}h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overtime-stat-card stat-red">
            <div className="overtime-stat-content">
              <div className="overtime-stat-info">
                <DollarSign className="overtime-stat-icon-main" />
                <div className="overtime-stat-details">
                  <p className="overtime-stat-title">Total OT Pay</p>
                  <p className="overtime-stat-value">${stats.totalOvertimePay}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="overtime-filters-container">
          <div className="overtime-filters-row">
            <div className="overtime-search-filters">
              {/* Search */}
              <div className="overtime-search-box">
                <Search className="overtime-search-icon" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="overtime-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Date Range */}
              <select 
                className="overtime-filter-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
              </select>

              {/* Department Filter */}
              <select 
                className="overtime-filter-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select 
                className="overtime-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="high">High OT (2-4h)</option>
                <option value="medium">Medium OT (1-2h)</option>
                <option value="low">Low OT (0-1h)</option>
              </select>
            </div>

            {/* Export Button */}
            <button onClick={handleExport} className="overtime-export-btn" disabled={loading}>
              <Download className="overtime-btn-icon" />
              Export
            </button>
          </div>
        </div>

        {/* Overtime Table */}
        <div className="overtime-table-container">
          <div className="overtime-table-wrapper">
            {loading ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#666' 
              }}>
                Loading overtime data...
              </div>
            ) : (
              <table className="overtime-table">
                <thead className="overtime-table-header">
                  <tr>
                    <th className="overtime-table-th">Employee</th>
                    <th className="overtime-table-th">Date</th>
                    <th className="overtime-table-th">Clock In</th>
                    <th className="overtime-table-th">Clock Out</th>
                    <th className="overtime-table-th">Regular Hours</th>
                    <th className="overtime-table-th">OT Hours</th>
                    <th className="overtime-table-th">Hourly Rate</th>
                    <th className="overtime-table-th">Regular Pay</th>
                    <th className="overtime-table-th">OT Pay</th>
                    <th className="overtime-table-th">Status</th>
                  </tr>
                </thead>
                <tbody className="overtime-table-body">
                  {statusFilteredData.map((record) => (
                    <tr key={record.id} className="overtime-table-row">
                      <td className="overtime-table-td">
                        <div className="overtime-employee-info">
                          <div className="overtime-employee-avatar">
                            <span className="overtime-avatar-text">
                              {record.employeeName?.split(' ').map(n => n[0]).join('') || 'NA'}
                            </span>
                          </div>
                          <div className="overtime-employee-details">
                            <div className="overtime-employee-name">{record.employeeName}</div>
                            <div className="overtime-employee-meta">
                              {record.position} • {record.department} • Base: ${record.baseSalary}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="overtime-table-td">{formatDate(record.date)}</td>
                      <td className="overtime-table-td overtime-table-time">{formatTime(record.checkInTime)}</td>
                      <td className="overtime-table-td overtime-table-time">{formatTime(record.checkOutTime)}</td>
                      <td className="overtime-table-td overtime-table-hours">{record.regularHours}h</td>
                      <td className="overtime-table-td overtime-table-overtime">{record.overtimeHours}h</td>
                      <td className="overtime-table-td overtime-table-pay">${record.hourlyRate}/hr</td>
                      <td className="overtime-table-td overtime-table-pay">${record.regularPay}</td>
                      <td className="overtime-table-td overtime-table-overtime-pay">${record.overtimePay}</td>
                      <td className="overtime-table-td">{getStatusBadge(record.overtimeHours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && statusFilteredData.length === 0 && (
            <div className="overtime-empty-state">
              <div className="overtime-empty-title">No overtime records found</div>
              <div className="overtime-empty-subtitle">Try adjusting your search or filter criteria</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {statusFilteredData.length > 0 && (
          <div className="overtime-pagination-container">
            <div className="overtime-pagination-info">
              Showing <span className="overtime-pagination-highlight">1</span> to{' '}
              <span className="overtime-pagination-highlight">{statusFilteredData.length}</span> of{' '}
              <span className="overtime-pagination-highlight">{pagination.total || statusFilteredData.length}</span> results
            </div>
            <div className="overtime-pagination-controls">
              <button className="overtime-pagination-btn overtime-pagination-btn-disabled" disabled>
                Previous
              </button>
              <button className="overtime-pagination-btn overtime-pagination-btn-active">
                1
              </button>
              <button className="overtime-pagination-btn overtime-pagination-btn-disabled" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimePay;

  //
