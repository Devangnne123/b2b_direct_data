import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  TableSortLabel,
  Box,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import { format } from 'date-fns';
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
  Mail,
  Clock,
  AlertCircle,
  Check,
  X,
  Phone,
  RefreshCw,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Sidebar from './Sidebar';

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

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return format(new Date(dateString), 'PPpp');
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
        'Date': format(new Date(item.date), 'PPpp'),
        'Process': item.process || getProcessName(item.type),
        'Filename': item.fileName || '-----',
        'Total Links': item.totallink || '-----',
        'Pending Count': item.pendingCount || '-----',
        'Status': item.status || item.final_status,
        'Credits Used': item.creditsUsed || 0,
        'Remaining Credits': item.remainingCredits || 0
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Verification Reports");
      
      const fileName = `Verification_Reports_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
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
          const status = item.type === 'directnumber' ? item.status : item.final_status;
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
    const status = item.type === 'directnumber' ? item.status : item.final_status;
    const statusLower = status?.toLowerCase() || '';
    const emailLower = item.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && statusLower === 'completed') ||
      (statusFilter === 'pending' && statusLower === 'pending') ||
      (statusFilter === 'not available' && statusLower === 'not available');

    if (roleId === 3) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (item.fileName && item.fileName.toLowerCase().includes(searchLower))) &&
        (emailLower.includes(emailFilter.toLowerCase())) &&
        statusMatch
      );
    } else if (roleId === 2 || roleId === 1) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (item.fileName && item.fileName.toLowerCase().includes(searchLower))) &&
        (item.email && item.email.toLowerCase() === savedEmail.toLowerCase()) && 
        statusMatch
      );
    } else if (roleId === 123) {
      return (
        ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
        (item.fileName && item.fileName.toLowerCase().includes(searchLower))) &&
        (emailLower.includes(emailFilter.toLowerCase())) &&
        statusMatch
      );
    }
    return false;
  });

  // Calculate counts for all data
  const getCounts = () => {
    if (reportType === 'all') {
      return {
        total: combinedData.length,
        completed: combinedData.filter(item => {
          const status = item.type === 'directnumber' ? item.status : item.final_status;
          return status?.toLowerCase() === 'completed';
        }).length,
        pending: combinedData.filter(item => {
          const status = item.type === 'directnumber' ? item.status : item.final_status;
          return status?.toLowerCase() === 'pending';
        }).length,
        other: combinedData.filter(item => {
          const status = item.type === 'directnumber' ? item.status : item.final_status;
          return !['completed', 'pending'].includes(status?.toLowerCase());
        }).length
      };
    }
    return reports[reportType]?.counts || { total: 0, completed: 0, pending: 0, other: 0 };
  };

  const counts = getCounts();

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
    switch (status) {
      case 'completed': case 'success': return 'success';
      case 'pending': case 'processing': return 'warning';
      case 'failed': case 'error': return 'error';
      default: return 'default';
    }
  };

  if (loading && !reports.verification && !reports.company && !reports.directnumber) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ margin: 2 }}>
        <strong>Error:</strong> {error}
      </Alert>
    );
  }

  return (
    <div className="main-con">
      <Sidebar userEmail={savedEmail} />
      <div className="right-side">
        <div className="right-p">
          <div className="main-body0">
            <div className="main-body1">
              <div className="left">
                <div className="history-table">
                  <div className="section-header">
                    <h3 className="section-title">
                      {reportType === 'all' ? 'All Verification Reports' : (reports[reportType]?.tableName || `${getProcessName(reportType)} Report`)}
                    </h3>
                    <div className="controls">
                      {lastUpdated && (
                        <span className="last-updated">
                          Last updated: {format(lastUpdated, 'PPpp')}
                        </span>
                      )}
                      <button 
                        className="refresh-btn"
                        onClick={handleManualRefresh}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={20} /> : 'Refresh Now'}
                      </button>
                      {/* <button 
                        className="save-btn"
                        onClick={saveCompletedReports}
                        disabled={loading || combinedData.length === 0 || saving}
                      >
                        {saving ? 'Saving...' : 'Save Completed Reports'}
                      </button> */}
                      <button 
                        className="download-btn"
                        onClick={exportToExcel}
                        disabled={loading || filteredData.length === 0 || downloading}
                      >
                        {downloading ? (
                          <>
                            <CircularProgress size={20} style={{ marginRight: '8px' }} />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download size={16} style={{ marginRight: '8px' }} />
                            Export to Excel
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="filter-controls">
                    <FormControl variant="outlined" className="report-type-select">
                      <InputLabel>Report Type</InputLabel>
                      <Select
                        value={reportType}
                        onChange={(e) => {
                          setReportType(e.target.value);
                          setCurrentPage(1);
                        }}
                        label="Report Type"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="verification">Contact Verification</MenuItem>
                        <MenuItem value="company">Company Verification</MenuItem>
                        <MenuItem value="directnumber">Direct Number</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl variant="outlined" className="status-filter-select">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        label="Status"
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="not available">Not Available</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Search by ID or Filename"
                      variant="outlined"
                      fullWidth
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="search-field"
                    />

                    <TextField
                      label="Filter by Email"
                      variant="outlined"
                      fullWidth
                      value={emailFilter}
                      onChange={(e) => {
                        setEmailFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="search-field"
                    />
                  </div>

                  {/* Status Summary Cards */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                        <Database className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold">{counts.total}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border border-green-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-green-600">{counts.completed}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                        <Clock className="h-5 w-5 text-yellow-500" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-yellow-600">{counts.pending}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Other Status</h3>
                        <AlertCircle className="h-5 w-5 text-gray-500" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-gray-600">{counts.other}</p>
                    </div>
                  </div> */}

                  <TableContainer component={Paper} className="table-container">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'uniqueId'}
                              direction={orderBy === 'uniqueId' ? order : 'asc'}
                              onClick={() => handleSort('uniqueId')}
                            >
                              ID
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Process</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'email'}
                              direction={orderBy === 'email' ? order : 'asc'}
                              onClick={() => handleSort('email')}
                            >
                              Email
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Filename</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'date'}
                              direction={orderBy === 'date' ? order : 'desc'}
                              onClick={() => handleSort('date')}
                            >
                              Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Total Links</TableCell>
                          <TableCell>Pending</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Credits Used</TableCell>
                          <TableCell>Remaining Credits</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentData.map((item, index) => {
                          const rowId = `${item.uniqueId}-${index}`;
                          const isExpanded = expandedRows[rowId];
                          const status = item.type === 'directnumber' ? item.status : item.final_status;
                          const processName = getProcessName(item.type);
                          
                          return (
                            <React.Fragment key={rowId}>
                              <TableRow className="table-row">
                                <TableCell>{indexOfFirstRow + index + 1}</TableCell>
                                <TableCell>{item.uniqueId}</TableCell>
                                <TableCell>{processName}</TableCell>
                                <TableCell>
                                  {item.email ? (
                                    <Tooltip title={item.email}>
                                      <span>{item.email.length > 15 ? `${item.email.substring(0, 8)}...` : item.email}</span>
                                    </Tooltip>
                                  ) : '-----'}
                                </TableCell>
                                <TableCell>
                                  {item.fileName ? (
                                    <Tooltip title={item.fileName}>
                                      <span>{item.fileName.length > 15 ? `${item.fileName.substring(0, 8)}...` : item.fileName}</span>
                                    </Tooltip>
                                  ) : '-----'}
                                </TableCell>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell>{item.totallink || '-----'}</TableCell>
                                <TableCell>{item.pendingCount || '-----'}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {getStatusIcon(status)}
                                    <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                                      {status?.toLowerCase() || '-----'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{item.creditsUsed || '0'}</TableCell>
                                <TableCell>{item.remainingCredits || '0'}</TableCell>
                                <TableCell>
                                  <Tooltip title={isExpanded ? "Hide details" : "Show details"}>
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleRowExpand(rowId)}
                                    >
                                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ margin: 1 }}>
                                      <Typography variant="h6" gutterBottom component="div">
                                        Detailed Information
                                      </Typography>
                                      <div className="detail-grid">
                                        {Object.entries(item)
                                          .filter(([key]) => !['uniqueId', 'fileName', 'totallink', 'pendingCount', 'email', 'final_status', 'status', 'process', 'creditsUsed', 'remainingCredits', 'date', 'type'].includes(key))
                                          .map(([key, value]) => (
                                            <div key={key} className="detail-item">
                                              <Typography variant="subtitle2" className="detail-label">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                              </Typography>
                                              <Typography variant="body2" className="detail-value">
                                                {value === null || value === undefined 
                                                  ? 'N/A' 
                                                  : typeof value === 'object' 
                                                    ? JSON.stringify(value, null, 2) 
                                                    : String(value)}
                                              </Typography>
                                            </div>
                                          ))}
                                      </div>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {filteredData.length > rowsPerPage && (
                    <div className="pagination-controls">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        <ChevronLeft size={16} />
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
                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <div className={`snackbar ${snackbar.severity}`}>
          {snackbar.message}
        </div>
      </Snackbar>

      <style jsx>{`
        .main-con {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
        }
        
        .right-side {
          flex: 1;
          padding: 20px;
        }
        
        .right-p {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 20px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .last-updated {
          font-size: 0.875rem;
          color: #718096;
        }
        
        .refresh-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: white;
          border: 1px solid #cbd5e0;
          color: #4a5568;
        }
        
        .refresh-btn:hover {
          background-color: #f7fafc;
        }
        
        .save-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #4299e1;
          border: 1px solid #4299e1;
          color: white;
        }
        
        .save-btn:hover {
          background-color: #3182ce;
        }
        
        .save-btn:disabled {
          background-color: #a0aec0;
          border-color: #a0aec0;
          cursor: not-allowed;
        }
        
        .download-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #38a169;
          border: 1px solid #38a169;
          color: white;
          display: flex;
          align-items: center;
        }
        
        .download-btn:hover {
          background-color: #2f855a;
        }
        
        .download-btn:disabled {
          background-color: #a0aec0;
          border-color: #a0aec0;
          cursor: not-allowed;
        }
        
        .filter-controls {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .report-type-select,
        .status-filter-select {
          min-width: 180px;
        }
        
        .search-field {
          min-width: 200px;
          flex: 1;
        }
        
        .table-container {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .table-row:hover {
          background-color: #f7fafc !important;
        }
        
        .header-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .link-cell {
          color: #3182ce;
          text-decoration: none;
        }
        
        .link-cell:hover {
          text-decoration: underline;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .status-badge.completed {
          background-color: #c6f6d5;
          color: #22543d;
        }
        
        .status-badge.pending {
          background-color: #feebc8;
          color: #7b341e;
        }
        
        .status-badge.error {
          background-color: #fed7d7;
          color: #822727;
        }
        
        .amount-cell {
          font-weight: 500;
        }
        
        .pagination-controls {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          gap: 5px;
        }
        
        .pagination-btn {
          padding: 6px 12px;
          border: 1px solid #cbd5e0;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-btn:hover {
          background-color: #f7fafc;
        }
        
        .pagination-btn.active {
          background-color: #4299e1;
          color: white;
          border-color: #4299e1;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .snackbar {
          padding: 12px 24px;
          border-radius: 4px;
          color: white;
          font-weight: 500;
        }
        
        .snackbar.success {
          background-color: #48bb78;
        }
        
        .snackbar.error {
          background-color: #f56565;
        }
        
        .snackbar.info {
          background-color: #4299e1;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          padding: 16px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .detail-item {
          padding: 12px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .detail-label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          word-break: break-word;
          font-size: 0.875rem;
          color: #2d3748;
        }
        
        .detail-value a {
          color: #3182ce;
          text-decoration: none;
        }
        
        .detail-value a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default VerificationUploadsReport;