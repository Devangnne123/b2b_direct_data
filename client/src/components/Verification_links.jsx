import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  Link as LinkIcon,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  X,
  AlertCircle,
  Clock,
  Star
} from 'lucide-react';
import { FaCoins } from 'react-icons/fa';
import Sidebar from "../components/Sidebar";
import TeamEmailForm from './TeamEmailForm';

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

function VerificationLinks() {
  const [file, setFile] = useState(null);
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [credits, setCredits] = useState(null);
  const [categorizedLinks, setCategorizedLinks] = useState([]);
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusCheckData, setStatusCheckData] = useState(null);
  const [rowsPerPage] = useState(10);
  const [creditCost, setCreditCost] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const dataRef = useRef({ categorizedLinks: [], credits: null });

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if (!isConfirmationActive) return;
     
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return 'You have pending upload confirmation. Are you sure you want to leave?';
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

  // Restore pending upload on component mount
  useEffect(() => {
    const savedUpload = sessionStorage.getItem('pendingVerificationUploads');
    if (savedUpload) {
      try {
        const parsed = JSON.parse(savedUpload);
        setPendingUpload(parsed);
        setShowConfirmation(true);
        setIsConfirmationActive(true);
      } catch (e) {
        sessionStorage.removeItem('pendingVerificationUploads');
      }
    }
  }, []);

  // Auto-set email from session storage
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setSavedEmail(user.email);
    } else {
      setSavedEmail("Guest");
    }
  }, []);

  // Fetch credits when email changes
  useEffect(() => {
    const fetchCredits = async () => {
      if (!savedEmail || savedEmail === "Guest") return;
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/${savedEmail}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        setCredits(response.data.credits);
        setCreditCost(response.data.creditCostPerLink_V);
        dataRef.current.credits = response.data.credits;
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
      }
    };

    fetchCredits();
  }, [savedEmail]);

  const checkStatus = async (uniqueId, isBackgroundCheck = false) => {
    try {
      // Only show processing for manual checks
      if (!isBackgroundCheck) setLoading(true);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/check-status-link/${uniqueId}`
      );

      // Silent update for background checks
      if (isBackgroundCheck) {
        setCategorizedLinks(prev => 
          prev.map(item => 
            item.uniqueId === uniqueId 
              ? { ...item, ...response.data } 
              : item
          )
        );
      } else {
        setStatusCheckData(response.data);
        toast.success(`Status checked for ${uniqueId}`);
      }

      // Handle completion logic silently
      if (response.data.status === 'completed' && !response.data.emailSent) {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/send-completion-email`, {
          email: savedEmail,
          uniqueId: uniqueId,
          totalRecords: response.data.totalRecords,
          completedRecords: response.data.completedRecords
        },{
          headers:{"Authorization": `Bearer ${token}`}
        });
        
        // Update state silently
        setCategorizedLinks(prev => 
          prev.map(item => 
            item.uniqueId === uniqueId 
              ? { ...item, emailSent: true } 
              : item
          )
        );
      }
    } catch (error) {
      if (!isBackgroundCheck) {
        console.error('Error checking status:', error);
        toast.error(error.response?.data?.message || 'Failed to check status');
      }
    } finally {
      if (!isBackgroundCheck) setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      if (!savedEmail || savedEmail === "Guest") return;
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-verification-links`, {
        headers: { "user-email": savedEmail, "Authorization": `Bearer ${token}`},
      });

      // Transform the data
      const transformedData = response.data.map(item => ({
        ...item,
        link: item.link || item.profileUrl || '',
        remark: item.remark || 'pending',
        matchLink: item.matchLink || null,
        date: item.date || item.createdAt || new Date().toISOString(),
        creditDeducted: item.creditDeducted || (item.matchCount || 0) * creditCost
      }));

      // Check status for all pending/processing batches in background
      transformedData
        .filter(item => item.final_status !== 'completed')
        .forEach(item => {
          checkStatus(item.uniqueId, true); // true indicates background check
        });

      if (JSON.stringify(transformedData) !== JSON.stringify(dataRef.current.categorizedLinks)) {
        setCategorizedLinks(transformedData);
        dataRef.current.categorizedLinks = transformedData;
      }

      // Refresh credits
      const creditRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/${savedEmail}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (creditRes.data.credits !== dataRef.current.credits) {
        setCredits(creditRes.data.credits);
        dataRef.current.credits = creditRes.data.credits;
      }
    } catch (error) {
      console.error("Silent refresh error:", error);
    }
  };

  useEffect(() => {
    silentRefresh();
    const intervalId = setInterval(silentRefresh, 10000);
    return () => clearInterval(intervalId);
  }, [savedEmail]);

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

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!savedEmail || savedEmail === "Guest") {
      toast.error('Please login to upload files');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setUploadProgress(0);
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload-excel-verification`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'user-email': savedEmail,
          "Authorization": `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      });

      const uploadData = {
        file: file.name,
        totalLinks: response.data.categorizedLinks?.length || 0,
        pendingCount: response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0,
        uniqueId: response.data.uniqueId,
        creditToDeduct: (response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0) * creditCost,
        date: response.data.date || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      // Save to session storage
      sessionStorage.setItem(
        'pendingVerificationUploads', 
        JSON.stringify(uploadData)
      );
      setPendingUpload(uploadData);
      setShowConfirmation(true);
      setIsConfirmationActive(true);
      
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Upload failed. Please try again.';
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const confirmProcessing = async () => {
    if (!pendingUpload || !savedEmail) {
      toast.error('Missing required information');
      return;
    }

    if (credits < pendingUpload.creditToDeduct) {
      toast.error(`Not enough credits. You need ${pendingUpload.creditToDeduct} credits`);
      return;
    }

    setLoading(true);
    
    try {
      // 1. Process the matching
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/process-matching/${pendingUpload.uniqueId}`, 
        {},
        { headers: { 'user-email': savedEmail } }
      );

      // 2. Deduct credits
      const creditRes = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/deduct-credits_v`,
        {
          userEmail: savedEmail,
          credits: pendingUpload.creditToDeduct,
          uniqueId: pendingUpload.uniqueId
        },{ headers: {"Authorization": `Bearer ${token}`  } }
      );
      setCredits(creditRes.data.updatedCredits);

      // 4. Fetch and send to all team emails
      const teamEmailsResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get/team-emails`,{
         headers: {"Authorization": `Bearer ${token}`  } }
      );
      if (!teamEmailsResponse.data.success) {
        throw new Error('Failed to fetch team emails');
      }

      const teamEmails = teamEmailsResponse.data.data || [];
      console.log(`Sending to ${teamEmails.length} team members`);

      if (teamEmails.length > 0) {
        const emailPromises = teamEmails.map(async (teamMember) => {
          try {
            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/send-verification-confirmation/link`,
              {
                email: teamMember.email,
                uniqueId: pendingUpload.uniqueId,
                totalLinks: pendingUpload.totalLinks,
                pendingCount: pendingUpload.pendingCount,
                creditCost: pendingUpload.creditToDeduct,
                initiatedBy: savedEmail
              },{
                headers: {"Authorization" : `Bearer ${token}`} 
              },
            );
            return { success: true, email: teamMember.email, data: response.data };
          } catch (error) {
            console.error(`Failed to send to ${teamMember.email}:`, error.response?.data || error.message);
            return { 
              success: false, 
              email: teamMember.email, 
              error: error.message 
            };
          }
        });

        const results = await Promise.all(emailPromises);
        const failedEmails = results.filter(r => !r.success);
        
        if (failedEmails.length > 0) {
          console.warn('Failed emails:', failedEmails);
          toast.warning(`Sent to team but failed for ${failedEmails.length} members`);
        } else {
          toast.success('Notifications sent to all team members');
        }
      }

      toast.success(`Processed ${pendingUpload.pendingCount} links! Deducted ${pendingUpload.creditToDeduct} credits`);
    } catch (error) {
      console.error('Processing error:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      toast.error(error.response?.data?.error || error.message || 'Processing failed');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      setPendingUpload(null);
      sessionStorage.removeItem('pendingVerificationUploads');
    }
  };

  const cancelUpload = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/delete-verification-uploads/${pendingUpload.uniqueId}`,{ headers: { "Authorization": `Bearer ${token}`  } }
      );
      
      toast.success('Upload cancelled and data deleted');
      
      // Refresh the data
      silentRefresh();
    } catch (error) {
      console.error('Error cancelling upload:', error);
      toast.error('Failed to cancel upload. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      setPendingUpload(null);
      setFile(null);
      document.getElementById('file-input').value = '';
      sessionStorage.removeItem('pendingVerificationUploads');
    }
  };

  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      const key = item?.uniqueId || `${item.fileName}_${item.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const getGroupStatus = (group) => {
    if (!group || group.length === 0) return "completed";
    
    // Check if email was sent (final completion)
    const hasEmailSent = group.some(item => item.emailSent);
    if (hasEmailSent) return "completed";
    
    const hasPending = group.some(item => 
      item.remark === 'pending' || 
      (!item.matchLink && item.remark !== 'invalid')
    );
    
    const allCompleted = group.every(item => 
      item.matchLink || 
      item.remark === 'invalid' || 
      item.remark === 'processed'
    );

    if (hasPending) return "pending";
    if (allCompleted) return "completed";
    return "incompleted";
  };

  const sortedGroupedEntries = useMemo(() => {
    const grouped = groupByUniqueId(categorizedLinks);
    let entries = Object.entries(grouped);

    return entries.sort((a, b) => {
      if (sortConfig.key === "status") {
        const aStatus = getGroupStatus(a[1]);
        const bStatus = getGroupStatus(b[1]);
        return sortConfig.direction === "desc"
          ? bStatus.localeCompare(aStatus)
          : aStatus.localeCompare(bStatus);
      }

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
    });
  }, [categorizedLinks, sortConfig]);

  const downloadGroupedEntry = async (group) => {
    try {
      if (!group || group.length === 0) {
        toast.error('No data available to download');
        return;
      }

      const uniqueId = group[0]?.uniqueId;
      if (!uniqueId) {
        toast.error('Missing unique identifier for download');
        return;
      }

      setLoading(true);
      
      // Fetch all data for this uniqueId
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/verification-uploads/${uniqueId}`,
        { headers: { "Authorization": `Bearer ${token}`  } }
      );
      
      const allData = response.data;

      // Prepare the data for Excel
      const rowData = allData.map((entry) => ({
        'File Name': entry.fileName || 'Unknown',
        'Unique ID': entry.uniqueId || 'Unknown',
        'Date': entry.date ? new Date(entry.date).toLocaleString() : 'Unknown',
        'Link': entry.link || 'N/A',
        'Status': entry.status || 'N/A',
        'Credits Used': entry.creditsUsed || 0,
        'Full Name': entry.full_name || 'N/A',
        'Headline': entry.head_title || 'N/A',
        'Location': entry.head_location || 'N/A',
        'Current Title': entry.title_1 || 'N/A',
        'Current Company': entry.company_1 || 'N/A',
        'Company Link': entry.company_link_1 || 'N/A',
        'Experience Duration': entry.exp_duration || 'N/A',
        'Experience Location': entry.exp_location || 'N/A',
        'Job Type': entry.job_type || 'N/A',
        'Previous Title': entry.title_2 || 'N/A',
        'Previous Company': entry.company_2 || 'N/A',
        'Previous Company Link': entry.company_link_2 || 'N/A',
        'Previous Experience Duration': entry.exp_duration_2 || 'N/A',
        'Previous Experience Location': entry.exp_location_2 || 'N/A',
        'Previous Job Type': entry.job_type_2 || 'N/A',
        'Final Remarks': entry.final_remarks || 'N/A',
        'Contacts ID': entry.list_contacts_id || 'N/A',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(rowData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "VerificationData");
      
      // Generate file name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `VerificationData_${uniqueId}_${timestamp}.xlsx`;
      
      // Download
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Download complete!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEntries = sortedGroupedEntries.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(sortedGroupedEntries.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

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

  const SortableHeader = ({ children, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc = sortConfig.direction === 'desc';

    return (
      <th
        onClick={() => requestSort(sortKey)}
        className={`cursor-pointer hover:bg-gray-100 ${
          isActive ? "font-bold" : ""
        }`}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && <span>{isDesc ? "↓" : "↑"}</span>}
        </div>
      </th>
    );
  };

  function PendingUploadAlert({
    onConfirm,
    onCancel,
    pendingUpload,
    currentCredits,
  }) {
    const totalLinks = pendingUpload.totalLinks || 0;
    const pendingCount = pendingUpload.pendingCount || 0;
    const notFoundCount = totalLinks - pendingCount;
    const creditsToDeduct = pendingUpload.creditToDeduct || 0;
    const remainingCredits = currentCredits - creditsToDeduct;

    return (
      <div className="modal-container">
        <h3 className="modal-heading">Confirm Upload</h3>
        <div className="modal-content-space">
          <div className="horizontal-table">
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">File</span>
              <span className="horizontal-table-value">
                📄 {pendingUpload.file}
              </span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Total Links</span>
              <span className="horizontal-table-value">🔗 {totalLinks}</span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Pending Links</span>
              <span className="horizontal-table-value text-warning">
                ⏳ {pendingCount}
              </span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Credits to Deduct</span>
              <span className="horizontal-table-value">
                💳 {creditsToDeduct} ({creditCost} per link)
              </span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Remaining Credits</span>
              <span className="horizontal-table-value">
                🧮{" "}
                <span
                  className={
                    remainingCredits < 0 ? "text-danger" : "text-success"
                  }
                >
                  {remainingCredits}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="buttons-container">
          <button onClick={onCancel} className="cancel-button">
            <span>❌</span>
            <span>Cancel Upload</span>
          </button>
          <button
            onClick={onConfirm}
            className="confirm-button"
            disabled={remainingCredits < 0}
            title={remainingCredits < 0 ? "Not enough credits" : ""}
          >
            <span>✅</span>
            <span>Confirm & Process</span>
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
                    <h1 className="app-title">LinkedIn Contact Verification</h1>
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
                            className={`file-upload-label ${
                              showConfirmation ? "file-upload-disabled" : ""
                            }`}
                          >
                            <FileSpreadsheet className="file-upload-icon" />
                            <span className="file-upload-text">
                              {file ? file.name : "Choose Excel File"}
                            </span>
                          </label>
                          <input
                            type="file"
                            id="file-input"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="file-upload-input"
                            disabled={showConfirmation || isConfirmationActive}
                            required
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-button ${
                              showConfirmation || !file || isConfirmationActive
                                ? "upload-button-disabled"
                                : ""
                            }`}
                            disabled={
                              !file ||
                              !savedEmail ||
                              savedEmail === "Guest" ||
                              credits < creditCost ||
                              loading ||
                              showConfirmation ||
                              isConfirmationActive
                            }
                          >
                            {loading ? (
                              <Loader2 className="upload-button-loader" />
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="upload-progress">
                            <div 
                              className="upload-progress-bar" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                        {!file && (
                          <p className="file-required-message">
                            * Please select a file to proceed
                          </p>
                        )}
                      </div>

                      {showConfirmation && pendingUpload && (
                        <PendingUploadAlert
                          onConfirm={confirmProcessing}
                          onCancel={cancelUpload}
                          pendingUpload={pendingUpload}
                          currentCredits={credits}
                        />
                      )}

                      {categorizedLinks.length > 0 && !showConfirmation && (
                        <div className="data-section">
                          <div className="data-section-header">
                            <h3 className="data-section-title">Your Verification History</h3>
                            <p className="data-section-info">
                              <strong>Cost per link:</strong> {creditCost} credits
                            </p>
                          </div>

                          {loading ? (
                            <div className="loading-state">
                              <Loader2 className="loading-spinner" />
                              <p className="loading-text">
                                Loading data...
                              </p>
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
                                        <SortableHeader sortKey="totalLinks">
                                          <LinkIcon className="table-icon" />
                                          <span className="table-header-text">Links</span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="pendingCount">
                                          <Users className="table-icon" />
                                          <span className="table-header-text">Pending</span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="status">
                                          <Star className="table-icon" />
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
                                        <th className="data-table-header-cell">
                                          <div className="data-table-header-content">
                                            <Download className="table-icon" />
                                            <span className="table-header-text">Download</span>
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="data-table-body">
                                      {currentEntries.map(
                                        ([uniqueId, group], idx) => {
                                          const first = group[0] || {};
                                          const status = getGroupStatus(group);

                                          return (
                                            <tr key={idx} className="data-table-row">
                                              <td className="data-table-cell">
                                                {indexOfFirstRow + idx + 1}
                                              </td>
                                              <td className="data-table-cell data-table-cell-id">
                                                {uniqueId}
                                              </td>
                                              <td className="data-table-cell">
                                                <div className="data-table-file-info">
                                                  <FileSpreadsheet className="data-table-file-icon" />
                                                  <span className="data-table-file-name">
                                                    {first.fileName || "Unknown"}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="data-table-cell">
                                                {first.totalLinks || 0}
                                              </td>
                                              <td className="data-table-cell">
                                                {first.pendingCount || 0}
                                              </td>
                                              <td className="data-table-cell">
                                                {status === "completed" ? (
                                                  <span className="status-badge status-badge-completed">
                                                    Completed
                                                  </span>
                                                ) : (
                                                  <button
                                                    onClick={() => checkStatus(uniqueId)}
                                                    className="status-check-button"
                                                    disabled={loading}
                                                  >
                                                    {loading ? (
                                                      <Loader2 className="status-check-loader" />
                                                    ) : (
                                                      "Check Status"
                                                    )}
                                                  </button>
                                                )}
                                              </td>
                                              <td className="data-table-cell">
                                                {formatDate(first.date)}
                                              </td>
                                              <td className="data-table-cell">
                                                <div className="data-table-credits">
                                                  <FaCoins className="data-table-credits-icon" />
                                                  <span>{first.creditDeducted || 0}</span>
                                                </div>
                                              </td>
                                              <td className="data-table-cell">
                                                <button
                                                  onClick={() =>
                                                    downloadGroupedEntry(group)
                                                  }
                                                  className="download-button"
                                                >
                                                  <Download className="download-button-icon" />
                                                  <span className="download-button-text">
                                                    Download
                                                  </span>
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {sortedGroupedEntries.length > rowsPerPage && (
                                <div className="pagination-container">
                                  <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className={`pagination-button ${
                                      currentPage === 1 ? "pagination-button-disabled" : ""
                                    }`}
                                  >
                                    <ChevronLeft className="pagination-icon" />
                                  </button>

                                  <div className="pagination-numbers">
                                    {Array.from(
                                      { length: totalPages },
                                      (_, i) => i + 1
                                    ).map((number) => (
                                      <button
                                        key={number}
                                        onClick={() => paginate(number)}
                                        className={`pagination-number ${
                                          currentPage === number ? "pagination-number-active" : ""
                                        }`}
                                      >
                                        {number}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-button ${
                                      currentPage === totalPages
                                        ? "pagination-button-disabled"
                                        : ""
                                    }`}
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
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {statusCheckData && (
                <div className="status-modal">
                  <div className="status-modal-content">
                    <h3>Verification Status for {statusCheckData.uniqueId}</h3>
                    <div className="status-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${(statusCheckData.completedRecords / statusCheckData.totalRecords) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {statusCheckData.completedRecords} of {statusCheckData.totalRecords} completed
                      </div>
                    </div>
                    <div className="status-summary">
                      <div className="status-item">
                        <span className="status-label">Overall Status:</span>
                        <span className={`status-value ${statusCheckData.status}`}>
                          {statusCheckData.status.toUpperCase()}
                        </span>
                      </div>
                      {statusCheckData.allCompleted && (
                        <div className="completion-message">
                          All verifications completed successfully!
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setStatusCheckData(null)}
                      className="close-modal-btn"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <ToastContainer 
                position="top-center" 
                autoClose={5000}
                className="toast-container-custom"
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default VerificationLinks;