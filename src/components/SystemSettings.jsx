import React, { useState } from 'react';
import './SystemSettings.css';
import { 
  Building, 
  Settings, 
  Shield, 
  Users, 
  Bell, 
  ChevronRight, 
  XCircle, 
  CheckCircle 
} from 'lucide-react';

const SystemSettings = () => {
  const [formData, setFormData] = useState({
    // Company Information
    companyName: 'Your Company Ltd.',
    companyEmail: 'info@company.com',
    companyAddress: '123 Business Street, City, State 12345',
    
    // System Preferences
    timezone: 'EST',
    currency: 'USD',
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    // HR Configuration
    workingHours: 8,
    annualLeave: 25,
    payFrequency: 'monthly',
    probationPeriod: 6,
    
    // Notifications
    emailNotifications: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    // Here you would typically send the data to your backend
    console.log('Saving settings:', formData);
    alert('Settings saved successfully!');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      // Reset form data or redirect
      window.location.reload();
    }
  };

  return (
    <div className="system-settings-content">
        <div className="settings-header">
          <h1>System Settings</h1>
          <div className="breadcrumb">
            <span>Home</span> <ChevronRight size={12} /> <span>System Settings</span>
          </div>
        </div>

        <div className="settings-form">
          {/* Company Information */}
          <div className="settings-card">
            <h2>
              <Building size={20} />
              Company Information
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyEmail">Company Email</label>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="companyAddress">Address</label>
              <textarea
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                className="form-control"
                rows={2}
              />
            </div>
          </div>

          {/* System Preferences */}
          <div className="settings-card">
            <h2>
              <Settings size={20} />
              System Preferences
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="CST">Central Time (CST)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="BDT">BDT - Bangladeshi Taka</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="settings-card">
            <h2>
              <Shield size={20} />
              Security Settings
            </h2>
            <div className="toggle-switch">
              <label>Two-Factor Authentication</label>
              <div className="switch">
                <input
                  type="checkbox"
                  name="twoFactorAuth"
                  checked={formData.twoFactorAuth}
                  onChange={handleInputChange}
                />
                <span className="slider"></span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                <input
                  type="number"
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={formData.sessionTimeout}
                  onChange={handleInputChange}
                  className="form-control"
                  min="5"
                  max="120"
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
                <input
                  type="number"
                  id="maxLoginAttempts"
                  name="maxLoginAttempts"
                  value={formData.maxLoginAttempts}
                  onChange={handleInputChange}
                  className="form-control"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* HR Configuration */}
          <div className="settings-card">
            <h2>
              <Users size={20} />
              HR Configuration
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="workingHours">Working Hours per Day</label>
                <input
                  type="number"
                  id="workingHours"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                  className="form-control"
                  min="1"
                  max="24"
                />
              </div>
              <div className="form-group">
                <label htmlFor="annualLeave">Annual Leave Days</label>
                <input
                  type="number"
                  id="annualLeave"
                  name="annualLeave"
                  value={formData.annualLeave}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  max="365"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payFrequency">Pay Frequency</label>
                <select
                  id="payFrequency"
                  name="payFrequency"
                  value={formData.payFrequency}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="probationPeriod">Probation Period (months)</label>
                <input
                  type="number"
                  id="probationPeriod"
                  name="probationPeriod"
                  value={formData.probationPeriod}
                  onChange={handleInputChange}
                  className="form-control"
                  min="1"
                  max="24"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-card">
            <h2>
              <Bell size={20} />
              Notifications
            </h2>
            <div className="toggle-switch">
              <label>Email Notifications</label>
              <div className="switch">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                />
                <span className="slider"></span>
              </div>
            </div>
            <div className="toggle-switch">
              <label>System Alerts</label>
              <div className="switch">
                <input
                  type="checkbox"
                  name="systemAlerts"
                  checked={formData.systemAlerts}
                  onChange={handleInputChange}
                />
                <span className="slider"></span>
              </div>
            </div>
            <div className="toggle-switch">
              <label>Weekly Reports</label>
              <div className="switch">
                <input
                  type="checkbox"
                  name="weeklyReports"
                  checked={formData.weeklyReports}
                  onChange={handleInputChange}
                />
                <span className="slider"></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              <XCircle size={16} />
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <CheckCircle size={16} />
              Save Changes
            </button>
          </div>
        </div>
    </div>
  );
};

export default SystemSettings;