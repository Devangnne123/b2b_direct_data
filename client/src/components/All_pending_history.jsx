import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download,
  Calendar,
  Users,
  Link as LinkIcon,
  FileSpreadsheet,
  Star,
  Database,
  ChevronLeft,
  ChevronRight,
  Hash,
  Copy as ContentCopyIcon,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import Sidebar from './Sidebar';
import * as XLSX from 'xlsx';
import '../css/AllHistory.css';

const VerificationUploadsReport = () => {
  const [reports, setReports] = useState({
    verification: null,
    company: null,
    directnumber: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [saving, setSaving] = useState(false);
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [roleId, setRoleId] = useState("Guest");
  const [creatorMap, setCreatorMap] = useState({});

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const roleId = user?.roleId;
    setRoleId(roleId);
    if (user?.email) {
      setSavedEmail(user.email);
    }
    fetchAllReports();
  }, []);

  const token = sessionStorage.getItem('token');

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      
      const [verificationRes, companyRes, directnumberRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/VerificationUpload/report`,{ headers: { "Authorization": `Bearer ${token}`  } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/company/report`,{ headers: { "Authorization": `Bearer ${token}`  } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/Direct-number/report`,{ headers: { "Authorization": `Bearer ${token}`  } })
      ]);

      setReports({
        verification: verificationRes.data,
        company: companyRes.data,
        directnumber: directnumberRes.data
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const combinedData = reportType === 'all' ? [
        ...(reports.verification?.data || []).map(item => ({ ...item, type: 'verification' })),
        ...(reports.company?.data || []).map(item => ({ ...item, type: 'company' })),
        ...(reports.directnumber?.data || []).map(item => ({ ...item, type: 'directnumber' }))
      ] : (reports[reportType]?.data || []).map(item => ({ ...item, type: reportType }));

      const uniqueEmails = [...new Set(combinedData.map(item => item.email).filter(Boolean))];
      
      const creators = await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/creator/${email}`, { headers: { "Authorization": `Bearer ${token}` } });
            return response.data;
          } catch (error) {
            console.error(`Error fetching creator for ${email}:`, error);
            return { userEmail: email, createdBy: null };
          }
        })
      );
      
      const newCreatorMap = creators.reduce((acc, curr) => {
        acc[curr.userEmail] = curr.createdBy;
        return acc;
      }, {});
      
      setCreatorMap(newCreatorMap);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  useEffect(() => {
    if (reports.verification || reports.company || reports.directnumber) {
      fetchCreators();
    }
  }, [reports, reportType]);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-500" />;
    
    switch(status.toLowerCase()) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not available':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProcessName = (type) => {
    switch(type) {
      case 'verification':
        return 'Contact Verification';
      case 'company':
        return 'Company Verification';
      case 'directnumber':
        return 'Direct Number Verification';
      default:
        return type;
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleManualRefresh = () => {
    fetchAllReports();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const exportToExcel = () => {
    setDownloading(true);
    
    try {
      const exportData = filteredData.map(item => ({
        'ID': item.uniqueId,
        'Email': item.email || '-----',
        'Date': formatDate(item.date),
        'Process': item.process || getProcessName(item.type),
        'Filename': item.fileName || '-----',
        'Total Links': item.totallink || '-----',
        'Pending Count': item.pendingCount || '-----',
        'Status': item.status || item.final_status,
        'Credits Used': item.creditsUsed || 0,
        'Remaining Credits': item.remainingCredits || 0,
        'Created By': item.email ? (creatorMap[item.email] || 'Admin') : '-----'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Verification Reports");
      
      const fileName = `Verification_Reports_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setSnackbar({
        open: true,
        message: 'Excel file downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export to Excel',
        severity: 'error'
      });
    } finally {
      setDownloading(false);
    }
  };

  const saveCompletedReports = async () => {
    try {
      setSaving(true);
      const completedReports = combinedData
        .filter(item => {
          const status = item.type === 'directnumber' ? item.final_status : item.final_status;
          return status?.toLowerCase() === 'completed';
        })
        .map(item => ({
          ...item,
          process: getProcessName(item.type),
          uniqueId: item.uniqueId,
          totallink: item.totallink,
          pendingCount: item.pendingCount,
          fileName: item.fileName,
          date: item.date,
          email: item.email,
          createdBy: creatorMap[item.email] || 'Admin',
          finalStatus: item.status || item.final_status,
          type: item.type
        }));

      if (completedReports.length === 0) {
        setSnackbar({
          open: true,
          message: 'No completed reports found to save',
          severity: 'info'
        });
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/save-completed-reports`, {
        reports: completedReports
      },{ headers: { "Authorization": `Bearer ${token}`  } });

      setSnackbar({
        open: true,
        message: `Successfully processed ${response.data.count} reports (${response.data.newCount} new, ${response.data.existingCount} existing)`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving completed reports:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save completed reports',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Combine all data when 'all' is selected
  const combinedData = reportType === 'all' ? [
    ...(reports.verification?.data || []).map(item => ({ ...item, type: 'verification' })),
    ...(reports.company?.data || []).map(item => ({ ...item, type: 'company' })),
    ...(reports.directnumber?.data || []).map(item => ({ ...item, type: 'directnumber' }))
  ] : (reports[reportType]?.data || []).map(item => ({ ...item, type: reportType }));

  const sortedData = [...combinedData].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(item => {
    const status = item.type === 'directnumber' ? item.final_status : item.final_status;
    const statusLower = status?.toLowerCase() || '';
    const emailLower = item.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    const createdBy = creatorMap[item.email] || 'Admin';
    const uniqueId = item.uniqueId || '';
    const fileName = item.fileName || '';
    
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && statusLower === 'completed') ||
      (statusFilter === 'pending' && statusLower === 'pending') ||
      (statusFilter === 'not available' && statusLower === 'not available');

    if (roleId === 3) {
      return (
        (uniqueId.toLowerCase().includes(searchLower) ||
        fileName.toLowerCase().includes(searchLower) ||
        createdBy.toLowerCase().includes(searchLower)) &&
        (emailLower.includes(emailFilter.toLowerCase())) &&
        statusMatch
      );
    } else if (roleId === 2) {
      return (
        (uniqueId.toLowerCase().includes(searchLower) ||
        fileName.toLowerCase().includes(searchLower) ||
        createdBy.toLowerCase() === savedEmail.toLowerCase()) &&
        (item.email && item.email.toLowerCase() === savedEmail.toLowerCase()) &&
        (createdBy.toLowerCase().includes(searchLower)) &&
        (emailLower.includes(emailFilter.toLowerCase())) && 
        statusMatch
      );
    } else if (roleId === 1) {
      return (
        (uniqueId.toLowerCase().includes(searchLower) ||
        fileName.toLowerCase().includes(searchLower) ||
        createdBy.toLowerCase() === savedEmail.toLowerCase()) &&
        ((item.email && item.email.toLowerCase() === savedEmail.toLowerCase()) || (createdBy.toLowerCase() === savedEmail.toLowerCase())) &&
        (createdBy.toLowerCase().includes(searchLower)) &&
        (emailLower.includes(emailFilter.toLowerCase())) &&
        statusMatch
      );
    } else if (roleId === 123) {
      return (
        (uniqueId.toLowerCase().includes(searchLower) ||
        fileName.toLowerCase().includes(searchLower) ||
        createdBy.toLowerCase().includes(searchLower)) &&
        (emailLower.includes(emailFilter.toLowerCase())) &&
        statusMatch
      );
    }
    return false;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentData = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const getStatusColor = (status) => {
    if (!status) return 'default';
    status = status.toLowerCase();
    if (status === 'completed' || status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'pending' || status === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (status === 'failed' || status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading && !reports.verification && !reports.company && !reports.directnumber) {
    return (
      <div className="app-layout">
        <div className="app-container">
          <Sidebar userEmail={savedEmail} />
          <div className="app-main-content">
            <div className="loading-state">
              <Loader2 className="loading-spinner" />
              <p className="loading-text">Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <div className="app-container">
          <Sidebar userEmail={savedEmail} />
          <div className="app-main-content">
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="app-container">
        <Sidebar userEmail={savedEmail} />
        <div className="app-main-content">
          <div className="app-content-wrapper">
            <nav className="app-header">
              <div className="app-header-content">
                <div className="app-header-left">
                  <h1 className="app-title">Verification Uploads Report</h1>
                </div>
                <div className="app-header-right">
                  <div className="credits-display">
                    <span className="credits-text">
                      User: {savedEmail}
                    </span>
                  </div>
                </div>
              </div>
            </nav>

            <section className="app-body">
              <div className="data-section">
                <div className="section-header">
                  <div className="section-info">
                    {lastUpdated && (
                      <p className="last-updated">
                        Last updated: {formatDate(lastUpdated)}
                      </p>
                    )}
                  </div>
                  <div className="section-controls">
                    <button 
                      className="refresh-button"
                      onClick={handleManualRefresh}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="refresh-icon" />
                      ) : (
                        'Refresh Data'
                      )}
                    </button>
                    <button 
                      className="save-button"
                      onClick={saveCompletedReports}
                      disabled={loading || combinedData.length === 0 || saving}
                    >
                      {saving ? 'Saving...' : 'Save Completed Reports'}
                    </button>
                    <button 
                      className="download-button"
                      onClick={exportToExcel}
                      disabled={loading || filteredData.length === 0 || downloading}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="download-icon" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="download-icon" />
                          Export to Excel
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="filter-controls">
                  <div className="filter-group">
                    <label>Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="filter-select"
                    >
                      <option value="all">All</option>
                      <option value="verification">Contact Verification</option>
                      <option value="company">Company Verification</option>
                      <option value="directnumber">Direct Number</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="filter-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="not available">Not Available</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Search by ID, Filename or Creator</label>
                    <input
                      type="text"
                      placeholder="Search by Unique ID, Filename or Created By"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Filter by Email</label>
                    <input
                      type="text"
                      placeholder="Filter by Email"
                      value={emailFilter}
                      onChange={(e) => {
                        setEmailFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="data-table-container">
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead className="data-table-header">
                        <tr>
                          <th>#</th>
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('uniqueId')}
                          >
                            <div className="header-content">
                              ID
                              {orderBy === 'uniqueId' && (
                                <span className="sort-icon">
                                  {order === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('process')}
                          >
                            <div className="header-content">
                              <Database className="header-icon" />
                              Process
                              {orderBy === 'process' && (
                                <span className="sort-icon">
                                  {order === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('email')}
                          >
                            <div className="header-content">
                              Email
                              {orderBy === 'email' && (
                                <span className="sort-icon">
                                  {order === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th>Filename</th>
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('date')}
                          >
                            <div className="header-content">
                              <Calendar className="header-icon" />
                              Date
                              {orderBy === 'date' && (
                                <span className="sort-icon">
                                  {order === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th>Total Links</th>
                          <th>Pending</th>
                          <th>Status</th>
                          <th>Credits Used</th>
                          <th>Remaining Credits</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="data-table-body">
                        {currentData.length > 0 ? (
                          currentData.map((item, index) => {
                            const rowId = `${item.uniqueId}-${index}`;
                            const isExpanded = expandedRows[rowId];
                            const status = item.type === 'directnumber' ? item.final_status : item.final_status;
                            const processName = getProcessName(item.type);
                            const createdBy = creatorMap[item.email] || 'Admin';
                            
                            return (
                              <React.Fragment key={rowId}>
                                <tr className="data-table-row">
                                  <td>{indexOfFirstRow + index + 1}</td>
                                  <td>{item.uniqueId}</td>
                                  <td>{processName}</td>
                                  <td>
                                    {item.email ? (
                                      <div className="email-cell-container">
                                        <div className="truncated-email">
                                          {item.email.length > 15 ? `${item.email.substring(0, 8)}...` : item.email}
                                        </div>
                                        <div className="full-email-tooltip">
                                          {item.email}
                                        </div>
                                      </div>
                                    ) : '-----'}
                                  </td>
                                  <td>
                                    {item.fileName ? (
                                      <div className="email-cell-container">
                                        <div className="truncated-email">
                                          {item.fileName.length > 15 ? `${item.fileName.substring(0, 8)}...` : item.fileName}
                                        </div>
                                        <div className="full-email-tooltip">
                                          {item.fileName}
                                        </div>
                                      </div>
                                    ) : '-----'}
                                  </td>
                                  <td>{formatDate(item.date)}</td>
                                  <td>{item.totallink || '-----'}</td>
                                  <td>{item.pendingCount || '-----'}</td>
                                  <td>
                                    <span className={`status-badge ${getStatusColor(status)}`}>
                                      {status?.toLowerCase() || '-----'}
                                    </span>
                                  </td>
                                  <td>{item.creditsUsed || '0'}</td>
                                  <td>{item.remainingCredits || '0'}</td>
                                  <td>
                                    <button
                                      className="expand-button"
                                      onClick={() => toggleRowExpand(rowId)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="expand-icon" />
                                      ) : (
                                        <ChevronDown className="expand-icon" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                                
                                {isExpanded && (
                                  <tr className="details-row">
                                    <td colSpan="12">
                                      <div className="details-content">
                                        <h4>Report Details</h4>
                                        <div className="details-grid">
                                          <div className="detail-item">
                                            <span className="detail-label">Created By:</span>
                                            <span className="detail-value">
                                              {createdBy || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Unique ID:</span>
                                            <span className="detail-value">
                                              {item.uniqueId || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Filename:</span>
                                            <span className="detail-value">
                                              {item.fileName || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Total Link:</span>
                                            <span className="detail-value">
                                              {item.totallink ? (
                                                <a href={item.totallink} target="_blank" rel="noopener noreferrer">
                                                  {item.totallink}
                                                </a>
                                              ) : 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Pending Count:</span>
                                            <span className="detail-value">
                                              {item.pendingCount || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Final Status:</span>
                                            <span className="detail-value">
                                              {status || 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr className="data-table-row">
                            <td colSpan="12" className="no-data">
                              No reports found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredData.length > rowsPerPage && (
                  <div className="pagination-container">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                    >
                      <ChevronLeft className="pagination-icon" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
                    >
                      <ChevronRight className="pagination-icon" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {snackbar.open && (
        <div className={`snackbar ${snackbar.severity}`}>
          {snackbar.message}
          <button onClick={handleCloseSnackbar} className="snackbar-close">
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationUploadsReport;