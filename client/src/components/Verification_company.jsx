import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Star
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
  const [uniqueId, setUniqueId] = useState('');
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
  const [statusCheckData, setStatusCheckData] = useState(null);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Add this state
  
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

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setSavedEmail(user.email);
      fetchCreditCost(user.email);
    } else {
      setSavedEmail("Guest");
    }
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!savedEmail || savedEmail === "Guest") return;
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/${savedEmail}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        setCredits(response.data.credits);
        setCreditCost(response.data.creditCostPerLink_C);
        dataRef.current.credits = response.data.credits;
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
      }
    };

    fetchCredits();
  }, [savedEmail, shouldRefresh]);

  const fetchCreditCost = async (email) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/users/credits/${email}`,
        {
          headers: { 
            "Authorization": `Bearer ${token}` 
          }
        }
      );
      setCreditCost(response.data.creditscost || 3);
    } catch (error) {
      console.error("Error fetching admin credit cost:", error);
    }
  };

  const silentRefresh = useCallback(async () => {
    try {
      if (!savedEmail || savedEmail === "Guest") return;

      const [linksRes, creditsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-verification-links-com`, {
          headers: {
            "user-email": savedEmail,
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/${savedEmail}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      const now = Date.now();
      const newData = linksRes.data || [];

      // Preserve processing status for items that are still within 1 minute window
      const updatedData = newData.map((item) => {
        const itemTime = new Date(item.date || 0).getTime();
        if (now - itemTime < 60000) {
          return { ...item, status: "pending" };
        }
        return item;
      });

      if (
        JSON.stringify(updatedData) !==
        JSON.stringify(dataRef.current.categorizedLinks)
      ) {
        setCategorizedLinks(updatedData);
        dataRef.current.categorizedLinks = updatedData;
      }

      if (creditsRes.data.credits !== dataRef.current.credits) {
        setCredits(creditsRes.data.credits);
        dataRef.current.credits = creditsRes.data.credits;
      }
    } catch (error) {
      console.error("Silent refresh error:", error);
    }
  }, [savedEmail, token]);

  useEffect(() => {
    silentRefresh();
    const intervalId = setInterval(silentRefresh,  50000);
    return () => clearInterval(intervalId);
  }, [silentRefresh]);

  // const checkStatus = async (uniqueId, isBackgroundCheck = false) => {
  //   if (isProcessing && !isBackgroundCheck) return; // Prevent multiple clicks
    
  //   try {
  //     if (!isBackgroundCheck) {
  //       setLoading(true);
  //       setIsProcessing(true);
  //     }
      
  //     const response = await axios.post(
  //       `${import.meta.env.VITE_API_BASE_URL}/check-status-link_com/${uniqueId}`
  //     );

  //     if (isBackgroundCheck) {
  //       setCategorizedLinks(prev => 
  //         prev.map(item => 
  //           item.uniqueId === uniqueId 
  //             ? { ...item, ...response.data } 
  //             : item
  //         )
  //       );
  //     } else {
  //       setStatusCheckData(response.data);
  //       toast.success(`Status checked for ${uniqueId}`);
  //     }

  //     if (response.data.status === 'completed' && !response.data.emailSent) {
  //       setCategorizedLinks(prev => 
  //         prev.map(item => 
  //           item.uniqueId === uniqueId 
  //             ? { ...item, emailSent: true } 
  //             : item
  //         )
  //       );
  //     }
  //   } catch (error) {
  //     if (!isBackgroundCheck) {
  //       console.error('Error checking status:', error);
  //       toast.error(error.response?.data?.message || 'Failed to check status');
  //     }
  //   } finally {
  //     if (!isBackgroundCheck) {
  //       setLoading(false);
  //       setIsProcessing(false);
  //     }
  //   }
  // };

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
    if (isProcessing) return; // Prevent multiple clicks
    
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
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (processingCheck.data.isProcessing) {
        toast.error("File processing! ");
        return;
      }
  
      setLoading(true);
      setIsProcessing(true);
      setFile(null); 
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload-excel-verification-com`, formData, {
        headers: {
          'user-email': savedEmail,
          "Authorization": `Bearer ${token}`,      
          "credit-cost": creditCost,
          "user-credits": credits
        }
      });

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
      setShouldRefresh(prev => !prev);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const confirmUpload = async () => {
    if (isConfirming || isProcessing) return;
   
    if (!savedEmail) {
      toast.error('Missing required information');
      return;
    }

    toast.success("File processed successfully. Ready for matching.");
    sessionStorage.removeItem("isProcessing");
    sessionStorage.removeItem("pendingUpload");
    setPendingUpload(null);
    setShowConfirmation(false);
    setIsConfirmationActive(false);

    try {
      setIsProcessing(true);
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
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.data.message === "Upload timed out") {
        toast.error(response.data.message);
        return;
      }

      const totalLinks = response.data.categorizedLinks?.length || 0;
      const pendingCount = response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0;
      const creditToDeduct = pendingCount * creditCost;

      const uploadData = {
        file: response.data.fileName,
        totalLinks: totalLinks,
        pendingCount: pendingCount,
        uniqueId: response.data.uniqueId,
        creditToDeduct: creditToDeduct,
        date: response.data.date || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      if (response.data.updatedCredits !== undefined) {
        setCredits(response.data.updatedCredits);
        toast.success(`Processing complete! Deducted ${creditToDeduct} credits`);
      } else {
        toast.success("File processed successfully. Ready for credit confirmation.");
      }

      sessionStorage.setItem("pendingUpload", JSON.stringify(uploadData));
      setPendingUpload(uploadData);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      setShouldRefresh(prev => !prev);
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message || 
                           error.response.data.error || 
                           'Processing failed';
        
        if (error.response.data.message === 'Insufficient credits') {
          cancelUpload();
        }
        
        toast.error(errorMessage);
      } else {
        console.error('Processing error:', error);
        toast.error('An unexpected error occurred during processing');
      }
    } finally {
      sessionStorage.removeItem("isProcessing");
      setIsProcessing(false);
      setIsConfirming(false);
      setLoading(false);
    }
  };

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
          isProcessing: false
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
    if (isProcessing) return; // Prevent multiple clicks
    
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
      setIsProcessing(true);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/verification-uploads-com/${uniqueId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      const allData = response.data;

      const rowData = allData.map((entry) => ({
        'File Name': entry.fileName || 'Unknown',
        'Unique ID': entry.uniqueId || 'Unknown',
        'Date': entry.date ? new Date(entry.date).toLocaleString() : 'Unknown',
        'Link': entry.link || 'N/A',
        'Clean Link': entry.clean_link || 'N/A',
        'remarks': entry.remark || 'N/A',
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
      const fileName = `VerificationData_${uniqueId}_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Download complete!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
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
  const currentEntries = sortedGroupedEntries.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedGroupedEntries.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
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

  function UploadConfirmationDialog({
    pendingUpload,
    onConfirm,
    onCancel,
    isConfirming,
    isProcessing // Add this prop
  }) {
    const blocked = isConfirming || isProcessing;

    return (
      <div className={`modal-container ${blocked ? "modal-blocked" : ""}`}>
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
              <span className="horizontal-table-label">Links Found</span>
              <span className="horizontal-table-value">
                🔗 {pendingUpload.linkCount}
              </span>
            </div>
          </div>

          <div className="info-message">
            Your file contains {pendingUpload.linkCount} LinkedIn links. Do you
            want to proceed with processing?
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
                            disabled={showConfirmation || isConfirmationActive || isProcessing}
                            required
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-button ${
                              showConfirmation || !file || isConfirmationActive || isProcessing
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
                              isConfirmationActive ||
                              isProcessing
                            }
                          >
                            {loading || isProcessing ? (
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

                      {showConfirmation && pendingUpload &&  (
                        <UploadConfirmationDialog
                          pendingUpload={pendingUpload}
                          onConfirm={confirmUpload}
                          onCancel={cancelUpload}
                          isConfirming={isConfirming}
                          isProcessing={isProcessing}
                        />
                      )}

                      { //categorizedLinks.length > 0 &&
                       !showConfirmation && (
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
                                                {first.totallink || 0}
                                              </td>
                                              <td className="data-table-cell">
                                                {first.pendingCount || 0}
                                              </td>
                                              <td className="data-table-cell">
                                                <div
                                                  className={`status-badge ${
                                                    first.final_status === "pending"
                                                      ? "status-badge-pending"
                                                      : first.final_status === "completed"
                                                      ? "status-badge-completed"
                                                      : first.final_status === "not available"
                                                      ? "status-badge-not-available"
                                                      : "status-badge-processing"
                                                  }`}
                                                >
                                                  {first.final_status === "pending"
                                                    ? "Pending"
                                                    : first.final_status === "completed"
                                                    ? "Completed"
                                                    : first.final_status === "not available"
                                                    ? "Not Available"
                                                    : "Processing"}
                                                </div>
                                              </td>
                                              <td className="data-table-cell">
                                                {formatDate(first.date)}
                                              </td>
                                              <td className="data-table-cell">
                                                <div className="data-table-credits">
                                                  <FaCoins className="data-table-credits-icon" />
                                                  <span>{first.creditsUsed || 0}</span>
                                                </div>
                                              </td>
                                              <td className="data-table-cell">
                                                <button
                                                  onClick={() =>
                                                    downloadGroupedEntry(group)
                                                  }
                                                  className="download-button"
                                                  disabled={isProcessing}
                                                >
                                                  {isProcessing ? (
                                                    <Loader2 className="download-button-loader" />
                                                  ) : (
                                                    <>
                                                      <Download className="download-button-icon" />
                                                      <span className="download-button-text">
                                                        Download
                                                      </span>
                                                    </>
                                                  )}
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
                                    disabled={currentPage === 1 || isProcessing}
                                    className={`pagination-button ${
                                      currentPage === 1 || isProcessing ? "pagination-button-disabled" : ""
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
                                        disabled={isProcessing}
                                      >
                                        {number}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages || isProcessing}
                                    className={`pagination-button ${
                                      currentPage === totalPages || isProcessing
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
                      {statusCheckData.status === 'completed' && (
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

export default Verification_company;