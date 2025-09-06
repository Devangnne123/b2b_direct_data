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
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import '../css/AllHistory.css';

const AllHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [reportType, setReportType] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [combinedData, setCombinedData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [creatorMap, setCreatorMap] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [roleId, setRoleId] = useState("Guest");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const roleId = user?.roleId;
    setRoleId(roleId);
    if (user?.email) {
      setSavedEmail(user.email);
    }
  }, []);

  const token = sessionStorage.getItem('token');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [linksRes, verificationRes, creditRes, companyVerificationRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/links/report`, { headers: { "Authorization": `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/verifications/report`, { headers: { "Authorization": `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/credit-transactions`, { headers: { "Authorization": `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/company-verifications/report`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      const transformData = (data, type) => {
        return data?.map(item => ({
          ...item,
          type: type
        })) || [];
      };

      const linksData = transformData(linksRes.data.data, 'links').map(item => ({
        ...item,
        process: 'Direct Number Enrichment',
        transactionType: 'Debit',
        amount: item.creditDeducted || 0,
        date: item.date,
        finalStatus: item.status
      }));

      const verificationData = transformData(verificationRes.data.data, 'verification').map(item => ({
        ...item,
        process: 'Contact Verification',
        transactionType: 'Debit',
        amount: item.creditsUsed || 0,
        date: item.date,
        finalStatus: item.final_status || 'N/A'
      }));

      const creditData = transformData(creditRes.data.data, 'credit').map(item => ({
        ...item,
        process: item.transactionType === 'Credit' ? 'Credit Received' : 'Credit Sent',
        amount: item.amount,
        date: item.createdAt,
        finalStatus: 'Completed',
        email: item.userEmail,
        transactionType: item.transactionType
      }));

      const companyVerificationData = transformData(companyVerificationRes.data.data, 'company-verification').map(item => ({
        ...item,
        process: 'Company Details',
        transactionType: 'Debit',
        amount: item.creditsUsed || 0,
        date: item.date,
        finalStatus: item.final_status || 'N/A',
        tableName: companyVerificationRes.data.tableName || 'Company Verification Report'
      }));

      const allCombined = [
        ...linksData,
        ...verificationData,
        ...creditData,
        ...companyVerificationData
      ].map(item => ({
        ...item,
        formattedDate: new Date(item.date),
        createdBy: null
      }));

      setCombinedData(allCombined);
      setData(allCombined);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Failed to fetch data',
        severity: 'error'
      });
    }
  };

  const fetchCreators = async () => {
    try {
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

  const saveCompletedReports = async () => {
    try {
      setSaving(true);
      const completedReports = combinedData
        .filter(item => item.finalStatus?.toLowerCase() === 'completed')
        .map(item => ({
          ...item,
          process: item.process,
          uniqueId: item.uniqueId,
          totallink: item.totallink,
          matchCount: item.matchCount,
          fileName: item.fileName,
          date: item.date,
          email: item.email,
          createdBy: creatorMap[item.email] || 'Admin',
          transactionType: item.transactionType,
          amount: item.amount,
          finalStatus: item.finalStatus,
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
      }, { headers: { "Authorization": `Bearer ${token}` } });

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

  const exportToExcel = () => {
    setDownloading(true);
    
    try {
      const exportData = filteredData.map(item => ({
        '#': indexOfFirstRow + filteredData.indexOf(item) + 1,
        'Email': item.email || '-----',
        'Date': format(new Date(item.date), 'PPpp'),
        'Process': item.process,
        'From': item.senderEmail || '-----',
        'To': item.email || '-----',
        'Amount': `${item.transactionType?.toLowerCase() === 'debit' ? '-' : ''}${Number(item.amount || 0).toFixed(2)}`,
        'Transaction Type': item.transactionType,
        'Balance': item.remainingCredits || '0',
        'Unique ID': item.uniqueId || '-----',
        'Filename': item.fileName || '-----',
        'Total Link': item.totallink || '-----',
        'Match Count': item.matchCount || '-----',
        'Created By': item.email ? (creatorMap[item.email] || 'Admin') : '-----',
        'Final Status': item.finalStatus || '-----'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaction History");
      
      const fileName = `TransactionHistory_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Copied to clipboard!',
      severity: 'success'
    });
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (combinedData.length > 0) {
      fetchCreators();
    }
  }, [combinedData]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleReportTypeChange = (event) => {
    const type = event.target.value;
    setReportType(type);
    setData(type === 'all' ? combinedData : combinedData.filter(item => item.type === type));
    setCurrentPage(1);
  };

  const handleManualRefresh = () => {
    fetchAllData();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const emailSearchLower = emailSearchTerm.toLowerCase();
    const createdBy = creatorMap[item.email] || 'Admin';
    
    const transactionMatch = 
      transactionFilter === 'all' || 
      (transactionFilter === 'debit' && item.transactionType?.toLowerCase() === 'debit') ||
      (transactionFilter === 'credit' && item.transactionType?.toLowerCase() === 'credit');
    
    if (roleId === 3) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (createdBy.toLowerCase().includes(searchLower))) &&
        (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
        transactionMatch
      );
    } else if (roleId === 2) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (createdBy.toLowerCase() === savedEmail.toLowerCase())) &&
        (item.email && item.email.toLowerCase() === savedEmail.toLowerCase()) && 
        (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
        
        transactionMatch
      );
    } else if (roleId === 1) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (createdBy.toLowerCase() === savedEmail.toLowerCase())) &&
        ((item.email && item.email.toLowerCase() === savedEmail.toLowerCase()) ||(createdBy.toLowerCase() === savedEmail.toLowerCase()) && (item.email || item.email.toLowerCase().includes(emailSearchLower)) )&&
         ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (createdBy.toLowerCase().includes(searchLower))) &&
        (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
        transactionMatch
        
      );
    } else if (roleId === 123) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (createdBy.toLowerCase().includes(searchLower))) &&
        (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
        transactionMatch
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

  const format = (date, formatStr) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-GB', {
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

  const getStatusColor = (status) => {
    if (!status) return 'default';
    status = status.toLowerCase();
    if (status === 'completed' || status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'pending' || status === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (status === 'failed' || status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTransactionColor = (type) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    return type.toLowerCase().includes('credit') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading && data.length === 0) {
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

  return (
    <div className="app-layout">
      <div className="app-container">
        <Sidebar userEmail={savedEmail} />
        <div className="app-main-content">
          <div className="app-content-wrapper">
            <nav className="app-header">
              <div className="app-header-content">
                <div className="app-header-left">
                  <h1 className="app-title">All History Report</h1>
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
                        Last updated: {format(lastUpdated, 'PPpp')}
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
                      onChange={handleReportTypeChange}
                      className="filter-select"
                    >
                      <option value="all">All</option>
                      <option value="links">Direct Number Enrichment</option>
                      <option value="verification">Contact Verification</option>
                      <option value="company-verification">Company Verification</option>
                      <option value="credit">Credit Transactions</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Transaction Type</label>
                    <select
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All</option>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Search by ID or Creator</label>
                    <input
                      type="text"
                      placeholder="Search by Unique ID or Created By"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Search by Email</label>
                    <input
                      type="text"
                      placeholder="Search by Email"
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
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
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('formattedDate')}
                          >
                            <div className="header-content">
                              <Calendar className="header-icon" />
                              Date
                              {orderBy === 'formattedDate' && (
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
                          <th>From</th>
                          <th>To</th>
                          <th 
                            className="sortable-header"
                            onClick={() => handleSort('amount')}
                          >
                            <div className="header-content">
                              Amount
                              {orderBy === 'amount' && (
                                <span className="sort-icon">
                                  {order === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th>Type</th>
                          <th>
                            <div className="header-content">
                              <LinkIcon className="header-icon" />
                              Balance
                            </div>
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="data-table-body">
                        {currentData.length > 0 ? (
                          currentData.map((item, index) => {
                            const rowId = item.uniqueId || index;
                            const isExpanded = expandedRows[rowId];
                            return (
                              <React.Fragment key={rowId}>
                                <tr className="data-table-row">
                                  <td>{indexOfFirstRow + index + 1}</td>
                                  <td>
  {item.email ? (
    <div className="email-cell-container">
      <div className="email-cell">
        {item.email.length > 15 ? `${item.email.substring(0, 8)}...` : item.email}
      </div>
      <div className="full-email-tooltip">
        {item.email}
      </div>
    </div>
  ) : '-----'}
</td>
                                  <td>{format(item.date, 'PPpp')}</td>
                                  <td>
                                    {item.process}
                                  </td>
                                  <td>
  {item.senderEmail ? (
    <div className="email-cell-container">
      <div className="truncated-email">
        {item.senderEmail.length > 15 ? `${item.senderEmail.substring(0, 8)}...` : item.senderEmail}
      </div>
      <div className="full-email-tooltip">
        {item.senderEmail}
      </div>
    </div>
  ) : '-----'}
</td>
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
                                  <td className={`amount-cell ${item.transactionType?.toLowerCase() === 'credit' ? 'credit' : 'debit'}`}>
                                    {item.transactionType?.toLowerCase() === 'debit' ? '-' : ''}
                                    {Number(item.amount || 0).toFixed(2)}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${getTransactionColor(item.transactionType)}`}>
                                      {item.transactionType}
                                    </span>
                                  </td>
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
                                    <td colSpan="10">
                                      <div className="details-content">
                                        <h4>Transaction Details</h4>
                                        <div className="details-grid">
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
                                            <span className="detail-label">Match Count:</span>
                                            <span className="detail-value">
                                              {item.matchCount || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Created By:</span>
                                            <span className="detail-value">
                                              {item.email ? (creatorMap[item.email] || 'Admin') : 'N/A'}
                                            </span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Final Status:</span>
                                            <span className="detail-value">
                                              {item.finalStatus || 'N/A'}
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
                            <td colSpan="10" className="no-data">
                              No found matching your criteria.
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

export default AllHistory;