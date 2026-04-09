

import React, { useState, useEffect } from 'react';

const Salary = () => {
  const [formData, setFormData] = useState({
    department: '',
    employee: '',
    baseSalary: '',
    allowances: '',
    deductions: '',
    payDate: '',
    salaryId: '',
  });

  const [searchMode, setSearchMode] = useState('employee');
  const [currentSalary, setCurrentSalary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recentSalaryIds, setRecentSalaryIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/salaries/dropdown/departments', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) throw new Error(`Failed to load departments: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setDepartments(data.data);
          if (data.data.length > 0) {
            setFormData(prev => ({ ...prev, department: data.data[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setMessage('Failed to load departments. Please log in again.');
      }
    };

    fetchDepartments();
    loadRecentSalaryIds();
  }, []);

  // Load recent salary IDs from localStorage
  const loadRecentSalaryIds = () => {
    const recent = JSON.parse(localStorage.getItem('recentSalaryIds') || '[]');
    setRecentSalaryIds(recent.slice(0, 5)); // Keep only last 5
  };

  // Save salary ID to recent list
  const saveToRecentIds = (salaryId) => {
    const recent = JSON.parse(localStorage.getItem('recentSalaryIds') || '[]');
    const updated = [salaryId, ...recent.filter(id => id !== salaryId)].slice(0, 5);
    localStorage.setItem('recentSalaryIds', JSON.stringify(updated));
    setRecentSalaryIds(updated);
  };

  // Fetch employees when department changes
  useEffect(() => {
    if (!formData.department || searchMode !== 'employee') return;

    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/salaries/dropdown/employees?departmentId=${formData.department}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!res.ok) throw new Error(`Failed to load employees: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setEmployees(data.data);
          setCurrentSalary(null);
          setFormData(prev => ({ 
            ...prev, 
            employee: '', 
            baseSalary: '', 
            allowances: '', 
            deductions: '', 
            payDate: '' 
          }));
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setMessage('Failed to load employees. Please log in again.');
      }
    };

    fetchEmployees();
  }, [formData.department, searchMode]);

  // Fetch current salary data when employee is selected (auto-fetch for employee mode)
  useEffect(() => {
    if (searchMode !== 'employee' || !formData.employee) {
      if (searchMode === 'employee') setCurrentSalary(null);
      return;
    }

    const fetchCurrentSalary = async () => {
      setLoadingEmployee(true);
      setSearchError('');
      try {
        const res = await fetch(
          `http://localhost:5000/api/salaries/current?employeeId=${formData.employee}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!res.ok) throw new Error(`Failed to load salary data: ${res.status}`);

        const data = await res.json();
        if (data.success) {
          setCurrentSalary(data.data);
          setFormData(prev => ({
            ...prev,
            baseSalary: data.data.baseSalary.toString(),
            allowances: data.data.allowances.toString(),
            deductions: data.data.deductions.toString(),
          }));
        }
      } catch (err) {
        console.error('Error fetching current salary:', err);
        setSearchError('Failed to load employee salary data.');
      } finally {
        setLoadingEmployee(false);
      }
    };

    fetchCurrentSalary();
  }, [formData.employee, searchMode]);

  // Manual search function for salary ID
  const handleSalaryIdSearch = async () => {
    if (!formData.salaryId) {
      setSearchError('Please enter a salary ID');
      return;
    }

    // Validate salary ID format (should be a positive number)
    if (!/^\d+$/.test(formData.salaryId) || parseInt(formData.salaryId) <= 0) {
      setSearchError('Salary ID must be a positive number');
      return;
    }

    setLoadingEmployee(true);
    setSearchError('');
    setCurrentSalary(null);

    try {
      const res = await fetch(
        `http://localhost:5000/api/salaries/${formData.salaryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await res.json();

      if (data.success) {
        setCurrentSalary(data.data);
        saveToRecentIds(parseInt(formData.salaryId));
        
        // Pre-fill form with current values
        setFormData(prev => ({
          ...prev,
          baseSalary: data.data.baseSalary.toString(),
          allowances: data.data.allowances.toString(),
          deductions: data.data.deductions.toString(),
          department: data.data.departmentId?.toString() || '',
          employee: data.data.employeeId.toString()
        }));

        // Load employees for this department if needed
        if (data.data.departmentId) {
          try {
            const empRes = await fetch(
              `http://localhost:5000/api/salaries/dropdown/employees?departmentId=${data.data.departmentId}`,
              {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              }
            );
            const empData = await empRes.json();
            if (empData.success) {
              setEmployees(empData.data);
            }
          } catch (err) {
            console.error('Error loading employees for salary record:', err);
          }
        }
      } else {
        if (res.status === 404) {
          setSearchError(`Salary record with ID ${formData.salaryId} not found`);
        } else {
          setSearchError(data.message || 'Failed to load salary record');
        }
      }
    } catch (err) {
      console.error('Error fetching salary by ID:', err);
      setSearchError('Failed to connect to server. Please try again.');
    } finally {
      setLoadingEmployee(false);
    }
  };

  // Handle quick access to recent salary IDs
  const handleQuickAccess = (salaryId) => {
    setFormData(prev => ({ ...prev, salaryId: salaryId.toString() }));
    setSearchError('');
    // Auto-search when clicking quick access
    setTimeout(() => handleSalaryIdSearch(), 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear search error when user starts typing in salary ID field
    if (name === 'salaryId') {
      setSearchError('');
    }
  };

  const handleSubmit = async () => {
    // Validation based on search mode
    if (searchMode === 'employee') {
      if (!formData.employee || !formData.baseSalary || !formData.payDate) {
        setMessage('Please fill in all required fields.');
        return;
      }
    } else {
      if (!formData.salaryId || !formData.baseSalary || !formData.payDate) {
        setMessage('Please fill in all required fields.');
        return;
      }
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        baseSalary: formData.baseSalary,
        allowances: formData.allowances || 0,
        deductions: formData.deductions || 0,
        payDate: formData.payDate,
      };

      // Add employee ID for new records, salary ID for updates
      if (searchMode === 'employee') {
        payload.employee = formData.employee;
      } else {
        payload.salaryId = formData.salaryId;
      }

      const response = await fetch('http://localhost:5000/api/salaries', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const action = searchMode === 'employee' ? 'created' : 'updated';
        setMessage(`Salary record ${action} successfully!`);
        
        // Save to recent IDs if it's a new record
        if (searchMode === 'employee' && data.data?.id) {
          saveToRecentIds(data.data.id);
        }
        
        // Refresh data
        if (searchMode === 'employee') {
          const selectedEmployee = formData.employee;
          setFormData(prev => ({ ...prev, employee: '' }));
          setTimeout(() => {
            setFormData(prev => ({ ...prev, employee: selectedEmployee }));
          }, 100);
        } else {
          // Refresh the current salary record
          handleSalaryIdSearch();
        }
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error submitting salary adjustment:', error);
      setMessage('Error submitting salary adjustment.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    
    title: {
      color: '#2c5aa0',
      fontSize: '28px',
      fontWeight: '600',
      margin: '0 0 10px 0'
    },
    
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
      margin: '0'
    },
    
    formContainer: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    
    formSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '25px'
    },
    
    searchModeContainer: {
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '25px'
    },
    
    searchModeTitle: {
      color: '#1e293b',
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 15px 0'
    },
    
    searchModeToggle: {
      display: 'flex',
      gap: '10px'
    },
    
    toggleButton: {
      padding: '10px 20px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: 'white',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    
    toggleButtonActive: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      color: 'white'
    },
    
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    
    helpText: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '400',
      marginBottom: '5px'
    },
    
    input: {
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none'
    },
    
    select: {
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none',
      cursor: 'pointer'
    },
    
    searchContainer: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-end'
    },
    
    searchInput: {
      flex: 1,
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none'
    },
    
    searchButton: {
      padding: '12px 20px',
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      whiteSpace: 'nowrap'
    },
    
    searchButtonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    
    recentIdsContainer: {
      marginTop: '10px'
    },
    
    recentIdsTitle: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '8px',
      fontWeight: '500'
    },
    
    recentIdsList: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    
    recentIdButton: {
      padding: '6px 12px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    
    recentIdButtonHover: {
      backgroundColor: '#e5e7eb',
      borderColor: '#9ca3af'
    },
    
    errorMessage: {
      padding: '10px',
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      color: '#dc2626',
      fontSize: '14px',
      marginTop: '8px'
    },
    
    loadingText: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '5px',
      fontStyle: 'italic'
    },
    
    currentSalaryPanel: {
      backgroundColor: '#f1f5f9',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    },
    
    panelTitle: {
      color: '#1e293b',
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 15px 0'
    },
    
    salaryInfoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px'
    },
    
    salaryInfoItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '4px',
      border: '1px solid #e2e8f0'
    },
    
    infoLabel: {
      fontSize: '14px',
      color: '#475569',
      fontWeight: '500'
    },
    
    infoValue: {
      fontSize: '14px',
      color: '#1e293b',
      fontWeight: '600'
    },
    
    adjustmentTitle: {
      color: '#1e293b',
      fontSize: '20px',
      fontWeight: '600',
      margin: '25px 0 15px 0',
      paddingTop: '20px',
      borderTop: '2px solid #e5e7eb'
    },
    
    previewPanel: {
      backgroundColor: '#ecfdf5',
      border: '2px solid #d1fae5',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    },
    
    previewTitle: {
      color: '#166534',
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 15px 0'
    },
    
    previewGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    
    previewItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      color: '#166534'
    },
    
    previewItemTotal: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '16px',
      fontWeight: '700',
      color: '#166534',
      paddingTop: '10px',
      borderTop: '1px solid #bbf7d0',
      marginTop: '5px'
    },
    
    submitButton: {
      backgroundColor: loading ? '#9ca3af' : '#3b82f6',
      color: 'white',
      padding: '15px 30px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '20px',
      width: '100%'
    },
    
    message: {
      padding: '15px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      marginTop: '20px',
      textAlign: 'center',
      backgroundColor: message.includes('Error') ? '#fee2e2' : '#d1fae5',
      color: message.includes('Error') ? '#dc2626' : '#166534',
      border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Salary Adjustment Management</h2>
        <p style={styles.subtitle}>Update employee salaries, add allowances for travel/performance, or apply deductions for taxes</p>
      </div>

      <div style={styles.formContainer}>
        <div style={styles.formSection}>
          {/* Search Mode Toggle */}
          <div style={styles.searchModeContainer}>
            <h3 style={styles.searchModeTitle}>Search Method</h3>
            <div style={styles.searchModeToggle}>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('employee');
                  setCurrentSalary(null);
                  setSearchError('');
                  setFormData(prev => ({ 
                    ...prev, 
                    salaryId: '', 
                    baseSalary: '', 
                    allowances: '', 
                    deductions: '', 
                    payDate: '' 
                  }));
                }}
                style={searchMode === 'employee' ? {...styles.toggleButton, ...styles.toggleButtonActive} : styles.toggleButton}
              >
                By Employee
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('salaryId');
                  setCurrentSalary(null);
                  setSearchError('');
                  setFormData(prev => ({ 
                    ...prev, 
                    employee: '', 
                    baseSalary: '', 
                    allowances: '', 
                    deductions: '', 
                    payDate: '' 
                  }));
                }}
                style={searchMode === 'salaryId' ? {...styles.toggleButton, ...styles.toggleButtonActive} : styles.toggleButton}
              >
                By Salary ID
              </button>
            </div>
          </div>

          {/* Employee Selection Mode */}
          {searchMode === 'employee' && (
            <div style={styles.row}>
              {/* Department Selection */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selection */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Employee</label>
                <select
                  name="employee"
                  value={formData.employee}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={!formData.department}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                {loadingEmployee && <div style={styles.loadingText}>Loading employee data...</div>}
              </div>
            </div>
          )}

          {/* Salary ID Mode */}
          {searchMode === 'salaryId' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Salary Record Search</label>
              <div style={styles.helpText}>Enter the salary record ID and click search</div>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  name="salaryId"
                  value={formData.salaryId}
                  onChange={handleChange}
                  placeholder="Enter salary record ID (e.g., 123)"
                  style={styles.searchInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSalaryIdSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSalaryIdSearch}
                  disabled={loadingEmployee || !formData.salaryId}
                  style={loadingEmployee || !formData.salaryId ? 
                    {...styles.searchButton, ...styles.searchButtonDisabled} : 
                    styles.searchButton
                  }
                >
                  {loadingEmployee ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {/* Recent Salary IDs */}
              {recentSalaryIds.length > 0 && (
                <div style={styles.recentIdsContainer}>
                  <div style={styles.recentIdsTitle}>Recent Salary IDs:</div>
                  <div style={styles.recentIdsList}>
                    {recentSalaryIds.map(id => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleQuickAccess(id)}
                        style={styles.recentIdButton}
                        title={`Load salary record #${id}`}
                      >
                        #{id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search Error */}
              {searchError && (
                <div style={styles.errorMessage}>
                  {searchError}
                </div>
              )}
            </div>
          )}

          {/* Current Salary Info Panel */}
          {currentSalary && (
            <div style={styles.currentSalaryPanel}>
              <h3 style={styles.panelTitle}>
                {searchMode === 'salaryId' ? 'Salary Record Details' : 'Current Salary Information'}
              </h3>
              <div style={styles.salaryInfoGrid}>
                {searchMode === 'salaryId' && (
                  <div style={styles.salaryInfoItem}>
                    <span style={styles.infoLabel}>Salary Record ID:</span>
                    <span style={styles.infoValue}>#{currentSalary.salaryId || formData.salaryId}</span>
                  </div>
                )}
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Employee:</span>
                  <span style={styles.infoValue}>{currentSalary.employeeName}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Position:</span>
                  <span style={styles.infoValue}>{currentSalary.position}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Department:</span>
                  <span style={styles.infoValue}>{currentSalary.department}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Base Salary:</span>
                  <span style={styles.infoValue}>{formatCurrency(currentSalary.baseSalary)}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Allowances:</span>
                  <span style={styles.infoValue}>{formatCurrency(currentSalary.allowances)}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>Deductions:</span>
                  <span style={styles.infoValue}>{formatCurrency(currentSalary.deductions)}</span>
                </div>
                <div style={styles.salaryInfoItem}>
                  <span style={styles.infoLabel}>{searchMode === 'salaryId' ? 'Record Date:' : 'Last Updated:'}</span>
                  <span style={styles.infoValue}>{formatDate(currentSalary.createdAt || currentSalary.lastUpdated)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Form */}
          {currentSalary && (
            <>
              <h3 style={styles.adjustmentTitle}>
                {searchMode === 'employee' ? 'Create New Salary Record' : 'Edit Salary Record'}
              </h3>
              
              <div style={styles.row}>
                {/* Base Salary */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Base Salary</label>
                  <div style={styles.helpText}>Monthly base salary amount</div>
                  <input
                    type="number"
                    step="0.01"
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleChange}
                    placeholder="Enter base salary"
                    style={styles.input}
                  />
                </div>

                {/* Pay Date */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Effective Date</label>
                  <div style={styles.helpText}>When this adjustment takes effect</div>
                  <input
                    type="date"
                    name="payDate"
                    value={formData.payDate}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row}>
                {/* Allowances */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Additional Allowances</label>
                  <div style={styles.helpText}>Travel, performance bonuses, etc.</div>
                  <input
                    type="number"
                    step="0.01"
                    name="allowances"
                    value={formData.allowances}
                    onChange={handleChange}
                    placeholder="Enter allowances"
                    style={styles.input}
                  />
                </div>

                {/* Deductions */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Deductions</label>
                  <div style={styles.helpText}>Taxes, insurance, other deductions</div>
                  <input
                    type="number"
                    step="0.01"
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleChange}
                    placeholder="Enter deductions"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Net Salary Preview */}
              {formData.baseSalary && (
                <div style={styles.previewPanel}>
                  <h4 style={styles.previewTitle}>Salary Preview</h4>
                  <div style={styles.previewGrid}>
                    <div style={styles.previewItem}>
                      <span>Base Salary:</span>
                      <span>{formatCurrency(parseFloat(formData.baseSalary) || 0)}</span>
                    </div>
                    <div style={styles.previewItem}>
                      <span>+ Allowances:</span>
                      <span>{formatCurrency(parseFloat(formData.allowances) || 0)}</span>
                    </div>
                    <div style={styles.previewItem}>
                      <span>- Deductions:</span>
                      <span>{formatCurrency(parseFloat(formData.deductions) || 0)}</span>
                    </div>
                    <div style={styles.previewItemTotal}>
                      <span>Net Salary:</span>
                      <span>{formatCurrency(
                        (parseFloat(formData.baseSalary) || 0) + 
                        (parseFloat(formData.allowances) || 0) - 
                        (parseFloat(formData.deductions) || 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                onClick={handleSubmit}
                style={styles.submitButton} 
                disabled={loading}
              >
                {loading ? 'Processing...' : (searchMode === 'employee' ? 'Create New Salary Record' : 'Update Salary Record')}
              </button>
            </>
          )}
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Salary;
