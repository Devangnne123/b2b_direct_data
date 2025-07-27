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
  ChevronDown
} from 'lucide-react';
import Sidebar from './Sidebar';
import * as XLSX from 'xlsx';

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
  const [roleId, setroleId] = useState("Guest");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const roleId = user?.roleId;
    setroleId(roleId);
    if (user?.email) {
      setSavedEmail(user.email);
    }
  }, []);

   const token = sessionStorage.getItem('token');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [linksRes, verificationRes, creditRes, companyVerificationRes] = await Promise.all([
        axios.get('http://13.203.218.236:8000/api/links/report',{ headers: { "Authorization": `Bearer ${token}`  } }),
        axios.get('http://13.203.218.236:8000/api/verifications/report',{ headers: { "Authorization": `Bearer ${token}`  } }),
        axios.get('http://13.203.218.236:8000/api/credit-transactions',{ headers: { "Authorization": `Bearer ${token}`  } }),
        axios.get('http://13.203.218.236:8000/api/company-verifications/report',{ headers: { "Authorization": `Bearer ${token}`  } })
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
            const response = await axios.get(`http://13.203.218.236:8000/user/creator/${email}`,{ headers: { "Authorization": `Bearer ${token}`  } });
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

      const response = await axios.post('http://13.203.218.236:8000/api/save-completed-reports', {
        reports: completedReports
      }, { headers: { "Authorization": `Bearer ${token}`  } });

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
    if (roleId === 3){
    return (
      
      ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
      (createdBy.toLowerCase().includes(searchLower)))&&
      (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
      transactionMatch
    );
  } else if (roleId === 2){
    return (
      
      ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
      (createdBy.toLowerCase()===savedEmail.toLowerCase())) &&
      (item.email && item.email.toLowerCase()===savedEmail.toLowerCase()) && 
      
      transactionMatch
    );


  }
  else if (roleId === 1){

    return (
      
      ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
      (createdBy.toLowerCase()===savedEmail.toLowerCase())) &&
      (item.email && item.email.toLowerCase()===savedEmail.toLowerCase()) && 
      
      transactionMatch
    );
  }
   if (roleId === 123){
    return (
      
      ((item.uniqueId && item.uniqueId.toLowerCase().includes(searchLower)) ||
      (createdBy.toLowerCase().includes(searchLower))) &&
      (item.email && item.email.toLowerCase().includes(emailSearchLower)) &&
      transactionMatch
    );
  }
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
    switch (status) {
      case 'completed': case 'success': return 'success';
      case 'pending': case 'processing': return 'warning';
      case 'failed': case 'error': return 'error';
      default: return 'default';
    }
  };

  const getTransactionColor = (type) => {
    if (!type) return 'default';
    return type.toLowerCase().includes('credit') ? 'success' : 'error';
  };

  if (loading && data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
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
                    <h3 className="section-title">All History</h3>
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
                      <button 
                        className="save-btn"
                        onClick={saveCompletedReports}
                        disabled={loading || combinedData.length === 0 || saving}
                      >
                        {saving ? 'Saving...' : 'Save Completed Reports'}
                      </button>
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
                        onChange={handleReportTypeChange}
                        label="Report Type"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="links">Link Report</MenuItem>
                        <MenuItem value="verification">Company Verification</MenuItem>
                        <MenuItem value="company-verification">Company Verification Report</MenuItem>
                        <MenuItem value="credit">Credit Transactions</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl variant="outlined" className="transaction-filter-select">
                      <InputLabel>Transaction Type</InputLabel>
                      <Select
                        value={transactionFilter}
                        onChange={(e) => setTransactionFilter(e.target.value)}
                        label="Transaction Type"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="debit">Debit</MenuItem>
                        <MenuItem value="credit">Credit</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Search by Unique ID or Created By"
                      variant="outlined"
                      fullWidth
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-field"
                    />

                    <TextField
                      label="Search by Email"
                      variant="outlined"
                      fullWidth
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="search-field"
                    />
                  </div>

                  <TableContainer component={Paper} className="table-container">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'email'}
                              direction={orderBy === 'email' ? order : 'asc'}
                              onClick={() => handleSort('email')}
                            >
                              Email
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'formattedDate'}
                              direction={orderBy === 'formattedDate' ? order : 'desc'}
                              onClick={() => handleSort('formattedDate')}
                            >
                              <div className="header-cell">
                                <Calendar size={16} />
                                <span>Date</span>
                              </div>
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'process'}
                              direction={orderBy === 'process' ? order : 'asc'}
                              onClick={() => handleSort('process')}
                            >
                              <div className="header-cell">
                                <Database size={16} />
                                <span>Process</span>
                              </div>
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>From</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'email'}
                              direction={orderBy === 'email' ? order : 'asc'}
                              onClick={() => handleSort('email')}
                            >
                              To
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Transaction Type</TableCell>
                          <TableCell>
                            <div className="header-cell">
                              <LinkIcon size={16} />
                              <span>Balance</span>
                            </div>
                          </TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentData.map((item, index) => {
                          const rowId = item.uniqueId || index;
                          const isExpanded = expandedRows[rowId];
                          return (
                            <React.Fragment key={rowId}>
                              <TableRow className="table-row">
                                <TableCell>{indexOfFirstRow + index + 1}</TableCell>
                                <TableCell>
                                  {item.email ? (
                                    <Tooltip title={item.email}>
                                      <span>{item.email.length > 15 ? `${item.email.substring(0, 8)}...` : item.email}</span>
                                    </Tooltip>
                                  ) : '-----'}
                                </TableCell>
                                <TableCell>{format(new Date(item.date), 'PPpp')}</TableCell>
                                <TableCell>
                                  {item.process}
                                </TableCell>
                                <TableCell>
                                  {item.senderEmail ? (
                                    <Tooltip title={item.senderEmail}>
                                      <span>{item.senderEmail.length > 15 ? `${item.senderEmail.substring(0, 8)}...` : item.senderEmail}</span>
                                    </Tooltip>
                                  ) : '-----'}
                                </TableCell>
                                <TableCell>
                                  {item.email ? (
                                    <Tooltip title={item.email}>
                                      <span>{item.email.length > 15 ? `${item.email.substring(0, 8)}...` : item.email}</span>
                                    </Tooltip>
                                  ) : '-----'}
                                </TableCell>
                                <TableCell align="right" className="amount-cell">
                                  {item.transactionType?.toLowerCase() === 'debit' ? '-' : ''}
                                  {Number(item.amount || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <span className={`status-badge ${
                                    item.transactionType?.toLowerCase() === 'credit' ? 'credit' : 'debit'
                                  }`}>
                                    {item.transactionType}
                                  </span>
                                </TableCell>
                                <TableCell align="right">{item.remainingCredits || '0'}</TableCell>
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
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ margin: 1 }}>
                                      <Typography variant="h6" gutterBottom component="div">
                                        Transaction Details
                                      </Typography>
                                      <div className="detail-grid">
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Unique ID
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.uniqueId || 'N/A'}
                                          </Typography>
                                        </div>
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Filename
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.fileName || 'N/A'}
                                          </Typography>
                                        </div>
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Total Link
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.totallink ? (
                                              <a href={item.totallink} target="_blank" rel="noopener noreferrer">
                                                {item.totallink}
                                              </a>
                                            ) : 'N/A'}
                                          </Typography>
                                        </div>
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Match Count
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.matchCount || 'N/A'}
                                          </Typography>
                                        </div>
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Created By
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.email ? (creatorMap[item.email] || 'Admin') : 'N/A'}
                                          </Typography>
                                        </div>
                                        <div className="detail-item">
                                          <Typography variant="subtitle2" className="detail-label">
                                            Final Status
                                          </Typography>
                                          <Typography variant="body2" className="detail-value">
                                            {item.finalStatus || 'N/A'}
                                          </Typography>
                                        </div>
                                        {Object.entries(item)
                                          .filter(([key]) => !['uniqueId', 'fileName', 'totallink', 'matchCount', 'email', 'finalStatus', 'process', 'transactionType', 'amount', 'remainingCredits', 'senderEmail', 'date', 'type', 'formattedDate'].includes(key))
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
        .transaction-filter-select,
        .credit-assigned-filter-select {
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
        
        .status-badge.credit {
          background-color: #c6f6d5;
          color: #22543d;
        }
        
        .status-badge.debit {
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

export default AllHistory;