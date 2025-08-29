import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Link as LinkIcon,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Filter,
  X
} from 'lucide-react';
import { FaCoins } from 'react-icons/fa';
import Sidebar from "../components/Sidebar";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          Something went wrong. Please try again.
        </div>
      );
    }
    return this.props.children;
  }
}

function Verification_company() {
  const [file, setFile] = useState(null);
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [credits, setCredits] = useState(null);
  const [categorizedLinks, setCategorizedLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [creditCost, setCreditCost] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailFilter, setEmailFilter] = useState('');
  const [showEmailFilter, setShowEmailFilter] = useState(false);
  const token = sessionStorage.getItem('token');

  // Fetch data from /api/verifications/minimal-report
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/verifications/minimal-report_C`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const verificationData = response.data.data.map((item) => ({
        ...item,
        process: "Company Verification",
        transactionType: "Debit",
        amount: item.creditDeducted || 0,
        date: item.date,
        finalStatus: item.final_status,
        type: "verifications",
      }));

      setCategorizedLinks(verificationData);
      // Initially filter by savedEmail
      setFilteredLinks(verificationData.filter(item => item.email === savedEmail));
    } catch (error) {
      console.error("Error fetching verification report:", error);
      toast.error("Failed to fetch verification history");
    } finally {
      setLoading(false);
    }
  }, [token, savedEmail]);

  // Apply email filter
  const applyEmailFilter = () => {
    if (emailFilter.trim() === '') {
      setFilteredLinks(categorizedLinks);
    } else {
      setFilteredLinks(categorizedLinks.filter(item => 
        item.email && item.email.toLowerCase().includes(emailFilter.toLowerCase())
      ));
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Clear email filter and show only current user's data
  const clearEmailFilter = () => {
    setEmailFilter('');
    setFilteredLinks(categorizedLinks.filter(item => item.email === savedEmail));
  };

  // Reset to show only current user's data
  const showOnlyMyData = () => {
    setEmailFilter('');
    setFilteredLinks(categorizedLinks.filter(item => item.email === savedEmail));
  };

  // Fetch credits and credit cost
  const fetchCreditCost = async (email) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCredits(response.data.credits);
      setCreditCost(response.data.creditCostPerLink_C || 5);
    } catch (error) {
      console.error("Error fetching credits:", error);
      setCredits(0);
      setCreditCost(5);
    }
  };

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 500000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Fetch user email and credits
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchCreditCost(user.email);
    }
  }, []);

  // Update filtered data when categorizedLinks changes
  useEffect(() => {
    setFilteredLinks(categorizedLinks.filter(item => item.email === savedEmail));
  }, [categorizedLinks, savedEmail]);

  // Handle refresh/back navigation
  useEffect(() => {
    if (!isConfirmationActive) return;

    const handleBeforeUnload = (e) => {
      if (isConfirmationActive && pendingUpload) {
        e.preventDefault();
        e.returnValue = "You have pending upload confirmation. Are you sure you want to leave?";
        return "You have pending upload confirmation. Are you sure you want to leave?";
      }
    };

    const handlePopState = () => {
      if (isConfirmationActive && pendingUpload) {
        cancelUpload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isConfirmationActive, pendingUpload]);

  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a valid Excel or CSV file');
        return;
      }
      setFile(selectedFile);
      setShowConfirmation(false);
      setPendingUpload(null);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (isProcessing) return;
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (creditCost === null) {
      toast.error("Please refresh your browser");
      return;
    }
    if (!savedEmail || savedEmail === "Guest") {
      toast.error('Please login to upload files');
      return;
    }

    try {
      const processingCheck = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/check-file-processing2`,
        {
          params: { userEmail: savedEmail },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (processingCheck.data.isProcessing) {
        toast.error("File processing! Please wait until the current process completes.");
        return;
      }

      setLoading(true);
      setIsProcessing(true);
      setFile(null);
      const formData = new FormData();
      formData.append('file', file);

       await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/set-file-processing2`,
          { userEmail: savedEmail, isProcessing: true }
        );

         toast.success("Duing file processing you can't able to uplaod new file");

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload-excel-verification-com`,
        formData,
        {
          headers: {
            'user-email': savedEmail,
            "Authorization": `Bearer ${token}`,
            "credit-cost": creditCost,
            "user-credits": credits,
          },
        }
      );

      if (creditCost * response.data.linkCount > credits) {
        toast.error("Insufficient credits");
        return;
      }

      if (response.data.requiresConfirmation) {
        setPendingUpload({
          type: "normalConfirmation",
          linkCount: response.data.linkCount,
          file: response.data.fileName,
          originalFile: file,
        });
        setShowConfirmation(true);
        setIsConfirmationActive(true);
        return;
      }

      if (response.data.message === "Max 10000 links allowed") {
        toast.error(response.data.message);
        return;
      }

      toast.success("File uploaded successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Confirm upload
  const confirmUpload = async () => {
    if (isConfirming || isProcessing) return;
    if (!savedEmail) {
      toast.error('Missing required information');
      return;
    }

    setIsConfirming(true);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", pendingUpload.originalFile);
      formData.append("userEmail", savedEmail);
      formData.append("processCredits", "true");

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/con-upload-excel-verification-com`,
        formData,
        {
          headers: {
            'user-email': savedEmail,
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.data.message === "Upload timed out") {
        toast.error(response.data.message);
        return;
      }

      if (response.data.status === "processing") {
        toast.success("File uploaded. Processing started...");
      } else {
        setCredits(response.data.updatedCredits);
        toast.success(`Processing complete! Deducted ${response.data.tempRecordsCreated * creditCost} credits`);
      }

      setPendingUpload(null);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Processing failed");
      if (error.response?.data?.message === 'Insufficient credits') {
        cancelUpload();
      }
    } finally {
      setIsConfirming(false);
      setIsProcessing(false);
    }
  };

  // Cancel upload
  const cancelUpload = async () => {
    if (isConfirming || isProcessing) {
      toast.info("Cannot cancel during processing");
      return;
    }

    try {
      setIsProcessing(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/set-file-processing2`,
        {
          userEmail: savedEmail,
          isProcessing: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      sessionStorage.removeItem("isProcessing");
      sessionStorage.removeItem("pendingUpload");
      setPendingUpload(null);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      toast.success("Upload cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel upload:", error);
      toast.error("Failed to cancel upload");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download grouped entry
  const downloadGroupedEntry = async (group) => {
    if (isProcessing) return;
    try {
      setLoading(true);
      setIsProcessing(true);
      const uniqueId = group[0]?.uniqueId;
      if (!uniqueId) {
        toast.error('Missing unique identifier for download');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/verification-Uploads-com/${uniqueId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allData = response.data;
      const rowData = allData.map((entry) => ({
        'File Name': entry.fileName || 'Unknown',
        'Unique ID': entry.uniqueId || 'Unknown',
        'Date': entry.date ? new Date(entry.date).toLocaleString() : 'Unknown',
        'Link': entry.link || 'N/A',
        'Clean Link': entry.clean_link || 'N/A',
        'Remarks': entry.remark || 'N/A',
        'Status': entry.final_status || 'N/A',
        'Credits Used': entry.creditDeducted || 0,
        'Company Name': entry.company_name || 'N/A',
        'Company URL': entry.company_url || 'N/A',
        'Headquarters': entry.company_headquater || 'N/A',
        'Industry': entry.company_industry || 'N/A',
        'Company Size': entry.company_size || 'N/A',
        'Employee Count': entry.employee_count || 'N/A',
        'Year Founded': entry.year_founded || 'N/A',
        'Specialties': entry.company_speciality || 'N/A',
        'LinkedIn URL': entry.linkedin_url || 'N/A',
        'Stock Name': entry.company_stock_name || 'N/A',
        'Verified Date': entry.verified_page_date || 'N/A',
        'Phone Number': entry.phone_number || 'N/A',
        'Followers': entry.company_followers || 'N/A',
        'Locations': entry.location_total || 'N/A',
        'Overview': entry.overview || 'N/A',
        'Website': entry.visit_website || 'N/A',
        'Final Remarks': entry.final_remarks || 'N/A',
        'Company ID': entry.company_id || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rowData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "VerificationData");
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      XLSX.writeFile(workbook, `VerificationData_${uniqueId}_${timestamp}.xlsx`);
      toast.success('Download complete!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Sorting
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEntries = useMemo(() => {
    const grouped = filteredLinks.reduce((acc, item) => {
      const key = item.uniqueId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    let entries = Object.entries(grouped);

    return entries.sort((a, b) => {
      const aValue = a[1][0]?.[sortConfig.key] || "";
      const bValue = b[1][0]?.[sortConfig.key] || "";

      if (sortConfig.key === "date") {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === "desc" ? dateB - dateA : dateA - dateB;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      return sortConfig.direction === "desc"
        ? bValue - aValue
        : aValue - bValue;
    }).slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredLinks, sortConfig, indexOfFirstRow, indexOfLastRow]);

  const totalPages = Math.ceil(filteredLinks.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sortable header component
  const SortableHeader = ({ children, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc = sortConfig.direction === 'desc';

    return (
      <th
        onClick={() => requestSort(sortKey)}
        className={`cursor-pointer hover:bg-gray-100 ${isActive ? "font-bold" : ""}`}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && <span>{isDesc ? "↓" : "↑"}</span>}
        </div>
      </th>
    );
  };

  // Upload confirmation dialog
  function UploadConfirmationDialog({
    pendingUpload,
    onConfirm,
    onCancel,
    isConfirming,
    isProcessing,
  }) {
    const blocked = isConfirming || isProcessing;

    return (
      <div className={`modal-container ${blocked ? "modal-blocked" : ""}`}>
        <h3 className="modal-heading">Confirm Upload</h3>
        <div className="modal-content-space">
          <div className="horizontal-table">
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">File</span>
              <span className="horizontal-table-value">📄 {pendingUpload.file}</span>
            </div>
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Links Found</span>
              <span className="horizontal-table-value">🔗 {pendingUpload.linkCount}</span>
            </div>
          </div>
          <div className="info-message">
            Your file contains {pendingUpload.linkCount} LinkedIn links. Do you want to proceed with processing?
          </div>
        </div>
        <div className="buttons-container">
          <button
            onClick={!blocked ? onCancel : undefined}
            className={`cancel-button ${blocked ? "button-disabled" : ""}`}
            disabled={blocked}
          >
            <span>❌</span>
            <span>{blocked ? "Processing..." : "Cancel"}</span>
          </button>
          <button
            onClick={!blocked ? onConfirm : undefined}
            className={`confirm-button ${blocked ? "button-disabled" : ""}`}
            disabled={blocked}
          >
            <span>✅</span>
            <span>{blocked ? "Processing..." : "Confirm"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-layout">
        <div className="app-container">
          <Sidebar userEmail={savedEmail} />
          <div className="app-main-content">
            <div className="app-content-wrapper">
              <nav className="app-header">
                <div className="app-header-content">
                  <div className="app-header-left">
                    <h1 className="app-title">LinkedIn Company Verification</h1>
                  </div>
                  <div className="app-header-right">
                    <div className="credits-display">
                      <img
                        src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                        alt="credits"
                        className="credits-icon"
                      />
                      <span className="credits-text">
                        Credits: {credits !== null ? credits : "Loading..."}
                      </span>
                    </div>
                  </div>
                </div>
              </nav>

              <section className="app-body">
                <div className="upload-section-container">
                  <div className="upload-section-wrapper">
                    <div className="upload-section-content">
                      <div className="file-upload-area">
                        <div className="file-upload-group">
                          <label
                            htmlFor="file-input"
                            className={`file-upload-label ${showConfirmation ? "file-upload-disabled" : ""}`}
                          >
                            <FileSpreadsheet className="file-upload-icon" />
                            <span className="file-upload-text">{file ? file.name : "Choose Excel File"}</span>
                          </label>
                          <input
                            type="file"
                            id="file-input"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="file-upload-input"
                            disabled={showConfirmation || isConfirmationActive || isProcessing}
                            required
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-button ${showConfirmation || !file || isConfirmationActive || isProcessing ? "upload-button-disabled" : ""}`}
                            disabled={!file || !savedEmail || savedEmail === "Guest" || credits < creditCost || loading || showConfirmation || isConfirmationActive || isProcessing}
                          >
                            {loading || isProcessing ? <Loader2 className="upload-button-loader" /> : "Upload File"}
                          </button>
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="upload-progress">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                        {!file && <p className="file-required-message">* Please select a file to proceed</p>}
                      </div>

                      {showConfirmation && pendingUpload && (
                        <UploadConfirmationDialog
                          pendingUpload={pendingUpload}
                          onConfirm={confirmUpload}
                          onCancel={cancelUpload}
                          isConfirming={isConfirming}
                          isProcessing={isProcessing}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="data-section">
                  <div className="data-section-header">
                    <h3 className="data-section-title">Your Verification History</h3>
                    <div className="data-section-controls">
                      <p className="data-section-info"><strong>Cost per link:</strong> {creditCost} credits</p>
                      {/* <div className="filter-controls">
                        <button 
                          onClick={() => setShowEmailFilter(!showEmailFilter)}
                          className="filter-toggle-button"
                        >
                          <Filter size={16} />
                          Filter by Email
                        </button>
                        {showEmailFilter && (
                          <div className="email-filter-container">
                            <input
                              type="text"
                              placeholder="Filter by email..."
                              value={emailFilter}
                              onChange={(e) => setEmailFilter(e.target.value)}
                              className="email-filter-input"
                            />
                            <button onClick={applyEmailFilter} className="filter-apply-button">
                              Apply
                            </button>
                            <button onClick={clearEmailFilter} className="filter-clear-button">
                              <X size={14} />
                            </button>
                            <button onClick={showOnlyMyData} className="filter-my-data-button">
                              Show Only My Data
                            </button>
                          </div>
                        )}
                      </div> */}
                    </div>
                  </div>

                  {loading ? (
                    <div className="loading-state">
                      <Loader2 className="loading-spinner" />
                      <p className="loading-text">Loading data...</p>
                    </div>
                  ) : currentEntries.length > 0 ? (
                    <>
                      <div className="data-table-container">
                        <div className="data-table-wrapper">
                          <table className="data-table">
                            <thead className="data-table-header">
                              <tr>
                                <th className="data-table-header-cell">
                                  <div className="data-table-header-content">
                                    <Hash className="table-icon" />
                                  </div>
                                </th>
                                <SortableHeader sortKey="uniqueId">
                                  <Database className="table-icon" />
                                  <span className="table-header-text">ID</span>
                                </SortableHeader>
                                <SortableHeader sortKey="fileName">
                                  <FileSpreadsheet className="table-icon" />
                                  <span className="table-header-text">File</span>
                                </SortableHeader>
                                <SortableHeader sortKey="totallink">
                                  <LinkIcon className="table-icon" />
                                  <span className="table-header-text">Links</span>
                                </SortableHeader>
                                <SortableHeader sortKey="matchCount">
                                  <LinkIcon className="table-icon" />
                                  <span className="table-header-text">Matches</span>
                                </SortableHeader>
                                <SortableHeader sortKey="finalStatus">
                                  <Database className="table-icon" />
                                  <span className="table-header-text">Status</span>
                                </SortableHeader>
                                <SortableHeader sortKey="date">
                                  <Calendar className="table-icon" />
                                  <span className="table-header-text">Date</span>
                                </SortableHeader>
                                <th className="data-table-header-cell">
                                  <div className="data-table-header-content">
                                    <FaCoins className="table-icon table-icon-credits" />
                                    <span className="table-header-text">Credits</span>
                                  </div>
                                </th>
                                <SortableHeader sortKey="email">
                                  <span className="table-header-text">Email</span>
                                </SortableHeader>
                                <th className="data-table-header-cell">
                                  <div className="data-table-header-content">
                                    <Download className="table-icon" />
                                    <span className="table-header-text">Download</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="data-table-body">
                              {currentEntries.map(([uniqueId, group], idx) => {
                                const first = group[0] || {};
                                return (
                                  <tr key={idx} className="data-table-row">
                                    <td className="data-table-cell">{indexOfFirstRow + idx + 1}</td>
                                    <td className="data-table-cell data-table-cell-id">{uniqueId}</td>
                                    <td className="data-table-cell">
                                      <div className="data-table-file-info">
                                        <FileSpreadsheet className="data-table-file-icon" />
                                        <span className="data-table-file-name">{first.fileName || "Unknown"}</span>
                                      </div>
                                    </td>
                                    <td className="data-table-cell">{first.totallink || 0}</td>
                                    <td className="data-table-cell">{first.matchCount || 0}</td>
                                    <td className="data-table-cell">
                                      <div
                                        className={`status-badge ${
                                          first.finalStatus === "pending"
                                            ? "status-badge-pending"
                                            : first.finalStatus === "completed"
                                            ? "status-badge-completed"
                                            : "status-badge-processing"
                                        }`}
                                      >
                                        {first.finalStatus === "pending"
                                          ? "Pending"
                                          : first.finalStatus === "completed"
                                          ? "Completed"
                                          : "Processing"}
                                      </div>
                                    </td>
                                    <td className="data-table-cell">{formatDate(first.date)}</td>
                                    <td className="data-table-cell">
                                      <div className="data-table-credits">
                                        <FaCoins className="data-table-credits-icon" />
                                        <span>{first.amount || 0}</span>
                                      </div>
                                    </td>
                                    <td className="data-table-cell">
                                      <span className={`email-cell ${first.email === savedEmail ? 'email-cell-current-user' : ''}`}>
                                        {first.email || "Unknown"}
                                      </span>
                                    </td>
                                    <td className="data-table-cell">
                                      <button
                                        onClick={() => downloadGroupedEntry(group)}
                                        className="download-button"
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="download-button-loader" />
                                        ) : (
                                          <>
                                            <Download className="download-button-icon" />
                                            <span className="download-button-text">Download</span>
                                          </>
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {filteredLinks.length > rowsPerPage && (
                        <div className="pagination-container">
                          <button
                            onClick={prevPage}
                            disabled={currentPage === 1 || isProcessing}
                            className={`pagination-button ${currentPage === 1 || isProcessing ? "pagination-button-disabled" : ""}`}
                          >
                            <ChevronLeft className="pagination-icon" />
                          </button>
                          <div className="pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                              <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`pagination-number ${currentPage === number ? "pagination-number-active" : ""}`}
                                disabled={isProcessing}
                              >
                                {number}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages || isProcessing}
                            className={`pagination-button ${currentPage === totalPages || isProcessing ? "pagination-button-disabled" : ""}`}
                          >
                            <ChevronRight className="pagination-icon" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-data-state">
                      No verification history found.
                    </div>
                  )}
                </div>
              </section>

              <ToastContainer position="top-center" autoClose={5000} className="toast-container-custom" />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Verification_company;