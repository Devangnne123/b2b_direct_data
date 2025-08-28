import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import "react-toastify/dist/ReactToastify.css";
import { FaCoins } from "react-icons/fa";
import {
  Download,
  Calendar,
  Users,
  Link as LinkIcon,
  FileSpreadsheet,
  Star,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../css/BulkLookup.css";
import "../css/UserS.css";
import Checkout from "../components/Checkout";
import Verification_links from "../components/Verification_links";
import RequestResetForm from "./RequestResetForm";
import LinkReport from "../components/LinkReport";
import VerficationUploadComReport from "./VerficationUploadComReport";
import VerificationUploadReport from "./VerificationUploadReport";
import CreditTransactions from "./CreditTransactions";
import SuperAdminTransactions from "./SuperAdminTransactions";
import AllHistory from "./AllReport";

import All_pending_history from "./All_pending_history";

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

function BulkLookup() {
  const [file, setFile] = useState(null);
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [uploadedData, setUploadedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [creditCost, setCreditCost] = useState(null);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Add this state
  const fileInputRef = useRef(null);

  const dataRef = useRef({ uploadedData: [], credits: null });
  const token = sessionStorage.getItem("token");

  // Handle refresh/back navigation when confirmation is active
  useEffect(() => {
    if (!isConfirmationActive) return;

    const handleBeforeUnload = (e) => {
      if (isConfirmationActive && pendingUpload) {
        e.preventDefault();
        e.returnValue =
          "You have pending upload confirmation. Are you sure you want to leave?";
        return "You have pending upload confirmation. Are you sure you want to leave?";
      }
    };

    const handlePopState = () => {
      if (isConfirmationActive && pendingUpload) {
        cancelUpload();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isConfirmationActive, pendingUpload]);

  const checkStatus = async (uniqueId) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    try {
      setIsProcessing(true);
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/check-status-bulk/${uniqueId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(
          `Status: ${response.data.overallStatus.toUpperCase()} | ` +
          `Completed: ${response.data.statusCounts.completed} | ` +
          `Pending: ${response.data.statusCounts.pending} | ` +
          `Failed: ${response.data.statusCounts.failed}`
        );
        
        // Update the local state if needed
        setUploadedData(prevData => 
          prevData.map(item => 
            item.uniqueId === uniqueId 
              ? { ...item, status: response.data.overallStatus } 
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check status');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  // const silentRefresh = useCallback(async () => {
  //   try {
  //     if (!savedEmail || savedEmail === "Guest") return;

  //     const [linksRes, creditsRes] = await Promise.all([
  //       axios.get(`${import.meta.env.VITE_API_BASE_URL}/bulklookup/get-links`, {
  //         headers: {
  //           "user-email": savedEmail,
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }),
  //       axios.get(
  //         `${import.meta.env.VITE_API_BASE_URL}/api/user/${savedEmail}`,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       ),
  //     ]);

  //     const now = Date.now();
  //     const newData = linksRes.data || [];

  //     // Preserve processing status for items that are still within 1 minute window
  //     const updatedData = newData.map((item) => {
  //       const itemTime = new Date(item.date || 0).getTime();
  //       if (now - itemTime < 60000) {

  //         return { ...item, status: "pending" };
  //       }
  //       return item;
  //     });

  //     if (
  //       JSON.stringify(updatedData) !==
  //       JSON.stringify(dataRef.current.uploadedData)
  //     ) {
  //       setUploadedData(updatedData);
  //       setFilteredData(updatedData);
  //       dataRef.current.uploadedData = updatedData;
  //     }

  //     if (creditsRes.data.credits !== dataRef.current.credits) {
  //       setCredits(creditsRes.data.credits);
  //       dataRef.current.credits = creditsRes.data.credits;
  //     }
  //   } catch (error) {
  //     console.error("Silent refresh error:", error);
  //   }
  // }, [savedEmail, token]);

  // useEffect(() => {
  //   silentRefresh();
  //   const intervalId = setInterval(silentRefresh, 50000);
  //   return () => clearInterval(intervalId);
  // }, [silentRefresh]);


  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchCreditCost(user.email);
    }
  }, []);

  const fetchCreditCost = async (email) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/${email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCredits(response.data.credits);
      setCreditCost(response.data.creditCostPerLink);
      dataRef.current.credits = response.data.credits;
    } catch (error) {
      console.error("Error fetching credits:", error);
      setCredits(0);
    }
  };

  const getGroupStatus = (group) => {
    if (!group || group.length === 0) return "processing";

    const firstItem = group[0] || {};
    const uniqueId = firstItem.uniqueId;

    // 1. Check processing status first (for recently uploaded files)
    if (processingStatus[uniqueId]) {
      return processingStatus[uniqueId].status;
    }

    // 3. Check explicit status values from database
    const statuses = group.map((item) => item.status || "not available");

    // Rule 2: If all are "not available" → completed
    if (statuses.every((status) => status === "not available")){
       if (statuses.includes("pending")){
         return "processing"
       }
    }

    // Rule 3: Mixed "completed" and "not available" → completed
    if (statuses.some((status) => status === "completed")) return "completed";

    // Default case
    return "processing";
  };

  const handleUpload = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    if (!file) {
      toast.error("Please choose a file to upload first");
      return;
    }
  
    if (creditCost === null) {
      toast.error("Please refresh your browser");
      return;
    }

    try {
      // First check processing status
      const processingCheck = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/check-file-processing`,
        {
          params: { userEmail: savedEmail },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (processingCheck.data.isProcessing) {
        toast.error("File processing! ");
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error("File processing! Please wait until the current process completes.");
        return;
      } else {
        toast.error("Error checking file status");
        console.error('Upload error:', error);
      }
    }

    setLoading(true);
    setIsProcessing(true);
    setFile(null); 
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload-excel`,
        formData,
        {
          headers: {
            "user-email": savedEmail,
            Authorization: `Bearer ${token}`,
            "credit-cost": creditCost,
            "user-credits": credits
          },
        }
      );

      if (creditCost * res.data.linkCount === credits){
        toast.error("Insufficient credits");
        return;
      }

      if (res.data.requiresConfirmation) {
        setPendingUpload({
          type: "normalConfirmation",
          linkCount: res.data.linkCount,
          file: res.data.fileName,
          originalFile: file,
        });
        setShowConfirmation(true);
        setIsConfirmationActive(true);
        return;
      }

      if (res.data.message === "Max 5000 links allowed") {
        toast.error(res.data.message);
        return;
      }

      toast.success("File uploaded successfully!");
      setShouldRefresh(true);
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

    toast.success("File processed successfully. Ready for matching.");
    // Clean up frontend state
    sessionStorage.removeItem("isProcessing");
    sessionStorage.removeItem("pendingUpload");
    setPendingUpload(null);
    setShowConfirmation(false);
    setIsConfirmationActive(false);
    
    try {
      setIsProcessing(true);
      // 1. Prepare form data with both file and processing parameters
      const formData = new FormData();
      formData.append("file", pendingUpload.originalFile);
      formData.append("userEmail", savedEmail);
      formData.append("processCredits", "true"); // Flag to process credits immediately

      // 2. Single API call that handles both upload and processing
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/process-linkedin-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "user-email": savedEmail,
          },
        }
      );
       
      if (response.data.message === "Upload timed out") {
        toast.error(response.data.message);
        return;
      }


       // 3. For BullMQ, we get an immediate response that processing started
    if (response.data.status === "processing") {
      // Start polling for job completion
      
      toast.success("File uploaded. Processing started...");
      return;
    }


      // 3. Handle response
      const totalLinks = response.data.totallink || 0;
      const matchCount = response.data.matchCount || 0;
      const creditToDeduct = response.data.tempRecordsCreated * creditCost;

      const uploadData = {
        file: response.data.fileName,
        matchCount,
        totallink: totalLinks,
        uniqueId: response.data.uniqueId,
        creditToDeduct,
        timestamp: new Date().toISOString(),
      };

      // Update state and credits if processing was successful
      if (response.data.updatedCredits !== undefined) {
        setCredits(response.data.updatedCredits);
        toast.success(`Processing complete! Deducted ${creditToDeduct} credits`);
      } else {
        toast.success("File processed successfully. Ready for credit confirmation.");
      }

      // Update application state
      sessionStorage.setItem("pendingUpload", JSON.stringify(uploadData));
      setPendingUpload(uploadData);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
      setShouldRefresh(true);

    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        const errorMessage = error.response.data.message || 
                          error.response.data.error || 
                          'Processing failed';
        
        // Specific handling for credit-related errors
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
      // Notify backend to cancel processing
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/set-file-processing`,
        {
          userEmail: savedEmail,
          isProcessing: false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Clean up frontend state
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

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      if (!item?.uniqueId) return;
      if (!grouped[item.uniqueId]) grouped[item.uniqueId] = [];
      grouped[item.uniqueId].push(item);
    });
    return grouped;
  };

  const sortedGroupedEntries = useMemo(() => {
    const grouped = groupByUniqueId(filteredData);
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
  }, [filteredData, sortConfig, processingStatus]);

  const downloadGroupedEntry = (group) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    try {
      setIsProcessing(true);
      const sortedGroup = [...group].sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateA - dateB;
      });

      const rowData = sortedGroup.map((entry) => {
        const links = entry?.link || null;
        const matchLink = entry?.matchLink || null;
        const mobile_number = entry?.mobile_number || "N/A";
        const mobile_number_2 = entry?.mobile_number_2 || "N/A";
        const person_name = entry?.person_name || "N/A";
        const person_location = entry?.person_location || "N/A";

        let status = "Completed";
        if (!matchLink) {
          status = "Incompleted";
        } else if (mobile_number !== "N/A" || mobile_number_2 !== "N/A") {
          status = "Completed";
        } else {
          status = "Pending";
        }

        return {
          fileName: entry?.fileName || "Unknown",
          uniqueId: entry?.uniqueId || "Unknown",
          date: entry?.date ? new Date(entry.date).toLocaleString() : "Unknown",
          orignal_link: links,
          matchLink: matchLink || "N/A",
          status,
          mobile_number,
          mobile_number_2,
          person_name,
          person_location,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rowData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LinkData");
      XLSX.writeFile(workbook, `LinkData_${group[0]?.uniqueId || "data"}.xlsx`);
      toast.success('Download complete!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    const isDesc = sortConfig.direction === "desc";

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
                    <h1 className="app-title">Direct Number Enrichment</h1>
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
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                              if (!showConfirmation) {
                                setFile(e.target.files[0]);
                              }
                            }}
                            className="file-upload-input"
                            disabled={showConfirmation || isConfirmationActive || isProcessing}
                            required
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-button ${
                              showConfirmation || !file || isConfirming || isProcessing
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
                              isConfirming ||
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

                      {/* {uploadedData.length > 0 && */
                       !showConfirmation && (
                        <div className="data-section">
                          <div className="data-section-header">
                            <h3 className="data-section-title">
                              Your Uploaded Files
                            </h3>
                            <p className="data-section-info">
                              <strong>Cost per link:</strong> {creditCost}{" "}
                              credits
                            </p>
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
                                          <span className="table-header-text">
                                            ID
                                          </span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="fileName">
                                          <FileSpreadsheet className="table-icon" />
                                          <span className="table-header-text">
                                            File
                                          </span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="totallink">
                                          <LinkIcon className="table-icon" />
                                          <span className="table-header-text">
                                            Links
                                          </span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="matchCount">
                                          <Users className="table-icon" />
                                          <span className="table-header-text">
                                            Matches
                                          </span>
                                        </SortableHeader>
                                        <SortableHeader sortKey="status">
                                          <Star className="table-icon" />
                                          <span className="table-header-text">
                                            Status
                                          </span>
                                        </SortableHeader>
                                       
                                        <SortableHeader sortKey="date">
                                          <Calendar className="table-icon" />
                                          <span className="table-header-text">
                                            Date
                                          </span>
                                        </SortableHeader>
                                        <th className="data-table-header-cell">
                                          <div className="data-table-header-content">
                                            <FaCoins className="table-icon table-icon-credits" />
                                            <span className="table-header-text">
                                              Credits
                                            </span>
                                          </div>
                                        </th>
                                        <th className="data-table-header-cell">
                                          <div className="data-table-header-content">
                                            <Download className="table-icon" />
                                            <span className="table-header-text">
                                              Download
                                            </span>
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
                                            <tr
                                              key={idx}
                                              className="data-table-row"
                                            >
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
                                                    {first.fileName ||
                                                      "Unknown"}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="data-table-cell">
                                                {first.totallink || 0}
                                              </td>
                                              <td className="data-table-cell">
                                                {first.matchedCount || 0}
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
                                                  <span>
                                                    {first.creditDeducted || 0}
                                                  </span>
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
                                      currentPage === 1 || isProcessing
                                        ? "pagination-button-disabled"
                                        : ""
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
                                          currentPage === number
                                            ? "pagination-number-active"
                                            : ""
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
                              No statistics found matching your search.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

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

export default BulkLookup;