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
  Clock
} from 'lucide-react';
import { FaCoins } from 'react-icons/fa';
import Sidebar from "../components/Sidebar";
import TeamEmailForm from './TeamEmailForm';

function VerificationLinks() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [credits, setCredits] = useState(null);
  const [categorizedLinks, setCategorizedLinks] = useState([]);
  const [uniqueId, setUniqueId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusCheckData, setStatusCheckData] = useState(null);
  const [rowsPerPage] = useState(10);
  const [creditCostPerLink, setCreditCostPerLink] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
 const [completedVerifications, setCompletedVerifications] = useState([]);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const dataRef = useRef({ categorizedLinks: [], credits: null });

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
      setEmail(user.email);
    } else {
      setEmail("Guest");
    }
  }, []);

  // Fetch credits when email changes
  useEffect(() => {
    const fetchCredits = async () => {
      if (!email || email === "Guest") return;
      
      try {
        const response = await axios.post(`http://13.203.218.236:8000/api/user/${email}`);
        setCredits(response.data.credits);
        setCreditCostPerLink(response.data.creditCostPerLink_V || 5);
        dataRef.current.credits = response.data.credits;
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
      }
    };

    fetchCredits();
  }, [email]);

const checkStatus = async (uniqueId, isBackgroundCheck = false) => {
  try {
    // Only show processing for manual checks
    if (!isBackgroundCheck) setIsProcessing(true);
    
    const response = await axios.post(
      `http://13.203.218.236:8000/check-status-link/${uniqueId}`
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
      await axios.post('http://13.203.218.236:8000/api/send-completion-email', {
        email: email,
        uniqueId: uniqueId,
        totalRecords: response.data.totalRecords,
        completedRecords: response.data.completedRecords
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
    if (!isBackgroundCheck) setIsProcessing(false);
  }
};
  const silentRefresh = async () => {
    try {
      if (!email || email === "Guest") return;
      
      const response = await axios.get("http://13.203.218.236:8000/get-verification-links", {
        headers: { "user-email": email },
      });

      // Transform the data
      const transformedData = response.data.map(item => ({
        ...item,
        link: item.link || item.profileUrl || '',
        remark: item.remark || 'pending',
        matchLink: item.matchLink || null,
        date: item.date || item.createdAt || new Date().toISOString(),
        creditDeducted: item.creditDeducted || (item.matchCount || 0) * 2
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
      const creditRes = await axios.get(`http://13.203.218.236:8000/api/user/${email}`);
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
  }, [email]);

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
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsProcessing(true);
      setUploadProgress(0);
      const response = await axios.post('http://13.203.218.236:8000/upload-excel-verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'user-email': email
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
        creditCost: (response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0) * creditCostPerLink,
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
      setIsProcessing(false);
    }
  };

 const confirmProcessing = async () => {
  // Validate required fields
  if (!pendingUpload || !email) {
    toast.error('Missing required information');
    return;
  }

  if (credits < pendingUpload.creditCost) {
    toast.error(`Not enough credits. You need ${pendingUpload.creditCost} credits`);
    return;
  }

  setIsProcessing(true);
  
  try {
    // 1. Process the matching
    await axios.post(
      `http://13.203.218.236:8000/process-matching/${pendingUpload.uniqueId}`, 
      {}, 
      { headers: { 'user-email': email } }
    );

    // 2. Deduct credits
    const creditRes = await axios.post(
      "http://13.203.218.236:8000/api/deduct-credits_v",
      {
        userEmail: email,
        credits: pendingUpload.creditCost,
        uniqueId: pendingUpload.uniqueId
      }
    );
    setCredits(creditRes.data.updatedCredits);

    // // 3. Send email to main user
    // const userEmailResponse = await axios.post(
    //   'http://13.203.218.236:8000/api/send-verification-confirmation',
    //   {
    //     email: email,
    //     uniqueId: pendingUpload.uniqueId,
    //     totalLinks: pendingUpload.totalLinks,
    //     pendingCount: pendingUpload.pendingCount,
    //     creditCost: pendingUpload.creditCost
    //   }
    // );

    // if (!userEmailResponse.data.success) {
    //   throw new Error('Failed to send confirmation to main user');
    // }

    // 4. Fetch and send to all team emails
    const teamEmailsResponse = await axios.get('http://13.203.218.236:8000/get/team-emails');
    if (!teamEmailsResponse.data.success) {
      throw new Error('Failed to fetch team emails');
    }

    const teamEmails = teamEmailsResponse.data.data || [];
    console.log(`Sending to ${teamEmails.length} team members`);

    if (teamEmails.length > 0) {
      const emailPromises = teamEmails.map(async (teamMember) => {
        try {
          const response = await axios.post(
            'http://13.203.218.236:8000/api/send-verification-confirmation',
            {
              email: teamMember.email,
              uniqueId: pendingUpload.uniqueId,
              totalLinks: pendingUpload.totalLinks,
              pendingCount: pendingUpload.pendingCount,
              creditCost: pendingUpload.creditCost,
              initiatedBy: email
            }
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

    toast.success(`Processed ${pendingUpload.pendingCount} links! Deducted ${pendingUpload.creditCost} credits`);
  } catch (error) {
    console.error('Processing error:', {
      error: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    toast.error(error.response?.data?.error || error.message || 'Processing failed');
  } finally {
    setIsProcessing(false);
    setShowConfirmation(false);
    setIsConfirmationActive(false);
    setPendingUpload(null);
    sessionStorage.removeItem('pendingVerificationUploads');
  }
};

  const cancelProcessing = async () => {
   

    try {
      setIsProcessing(true);
      await axios.delete(
        `http://13.203.218.236:8000/api/delete-verification-uploads/${pendingUpload.uniqueId}`
      );
      
      toast.success('Upload cancelled and data deleted');
      
      // Refresh the data
      silentRefresh();
    } catch (error) {
      console.error('Error cancelling upload:', error);
      toast.error('Failed to cancel upload. Please try again.');
    } finally {
      setIsProcessing(false);
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

      setIsProcessing(true);
      
      // Fetch all data for this uniqueId
      const response = await axios.get(
        `http://13.203.218.236:8000/api/verification-uploads/${uniqueId}`
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

  function PendingUploadAlert({ onConfirm, onCancel, pendingUpload, currentCredits, isProcessing }) {
    const remainingCredits = currentCredits - pendingUpload.creditCost;

    return (
      <div className="modal-container">
        <h3 className="modal-heading">Confirm Verification Processing</h3>
        <div className="modal-content-space">
          <div className="horizontal-table">
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">File</span>
              <span className="horizontal-table-value">📄 {pendingUpload.file}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Total Links</span>
              <span className="horizontal-table-value">🔗 {pendingUpload.totalLinks}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Pending Links</span>
              <span className="horizontal-table-value text-warning">⏳ {pendingUpload.pendingCount}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Credits to Deduct</span>
              <span className="horizontal-table-value">💳 {pendingUpload.creditCost}({creditCostPerLink} per link) </span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Remaining Credits</span>
              <span className="horizontal-table-value">
                🧮 <span className={remainingCredits < 0 ? "text-danger" : "text-success"}>
                  {remainingCredits}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="buttons-container">
          <button 
            onClick={onCancel} 
            className="cancel-button"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <>
                <span>❌</span>
                <span>Cancel</span>
              </>
            )}
          </button>
          <button
            onClick={onConfirm}
            className="confirm-button"
            disabled={remainingCredits < 0 || isProcessing}
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
    <div className="main">
      {/* Blocking overlay when confirmation is active */}
      {isConfirmationActive && (
        <div className="blocking-overlay"></div>
      )}
      
      <div className="main-con">
        <Sidebar Email={setEmail} />
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">LinkedIn Contact Verification</p>
                  <li className="credits-main1">
                    <h5 className="credits">
                      <img
                        src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                        alt="credits"
                        className="credits-icon"
                      />
                      Credits: {credits !== null ? credits : "Loading..."}
                    </h5>
                  </li>
                </li>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="upload-section">
                      <div className="file-upload-group">
                        <label
                          htmlFor="file-input"
                          className={`file-upload-label ${
                            isConfirmationActive ? "disabled" : ""
                          }`}
                        >
                          <FileSpreadsheet className="file-icon" />
                          <span>
                            {file ? file.name : "Choose Excel File"}
                          </span>
                        </label>
                        <input
                          type="file"
                          id="file-input"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                          className="file-input"
                          disabled={isProcessing || isConfirmationActive}
                          required
                        />
                        <button
                          onClick={handleUpload}
                          className={`upload-btn ${
                            !file || isProcessing || isConfirmationActive ? "disabled" : ""
                          }`}
                          disabled={!file || isProcessing || isConfirmationActive}
                        >
                          {isProcessing ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            "Upload File"
                          )}
                        </button>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {showConfirmation && pendingUpload && (
                      <PendingUploadAlert
                        onConfirm={confirmProcessing}
                        onCancel={cancelProcessing}
                        pendingUpload={pendingUpload}
                        currentCredits={credits}
                        
                      />
                    )}

                    {categorizedLinks.length > 0 && !showConfirmation && (
                      <div className="history-table">
                        <h3 className="section-title">Your Verification History</h3>
                        <p>
                          <strong>Cost per pending link:</strong> {creditCostPerLink} credits
                        </p>

                        {isProcessing ? (
                          <div className="loading-state">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">
                              Loading data...
                            </p>
                          </div>
                        ) : currentEntries.length > 0 ? (
                          <>
                            <div className="table-container">
                              <table className="link-data-table">
                                <thead>
                                  <tr>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <Hash className="h-4 w-4" />
                                      </div>
                                    </th>
                                    <SortableHeader sortKey="uniqueId">
                                      <Database className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="fileName">
                                      <FileSpreadsheet className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="totalLinks">
                                      <LinkIcon className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="pendingCount">
                                      <Users className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="status">
                                      <Clock className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="date">
                                      <Calendar className="h-4 w-4" />
                                    </SortableHeader>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <FaCoins className="h-4 w-4 text-yellow-500" />
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <Download className="h-4 w-4" />
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentEntries.map(([uniqueId, group], idx) => {
                                    const firstItem = group[0] || {};
                                    const status = getGroupStatus(group);
                                    
                                    return (
                                      <tr key={idx}>
                                        <td>{indexOfFirstRow + idx + 1}</td>
                                        <td className="font-mono text-sm">
                                          {uniqueId}
                                        </td>
                                        <td>
                                          <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                            <span className="truncate max-w-[180px]">
                                              {firstItem.fileName || "Unknown"}
                                            </span>
                                          </div>
                                        </td>
                                        <td>{firstItem.totalLinks}</td>
                                        <td>{firstItem.pendingCount}</td>
                                        <td>
  {status === 'completed' ? (
    <span className="completed-badge">
      Completed
    </span>
  ) : (
    <button
      onClick={() => checkStatus(uniqueId)}
      className="status-check-btn"
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="animate-spin h-4 w-4" />
      ) : (
        "Check Status"
      )}
    </button>
  )}
</td>
                                        {/* <td>
                                          <button
                                                onClick={() => checkStatus(uniqueId)}
                                                className="status-check-btn"
                                                disabled={isProcessing}
                                              >
                                                {isProcessing ? (
                                                  <Loader2 className="animate-spin h-4 w-4" />
                                                ) : (
                                                  "Check Status"
                                                )}
                                              </button>
                                        </td> */}
                                        <td>{formatDate(firstItem.date)}</td>
                                        <td>
                                          <div className="flex items-center gap-1">
                                            <FaCoins className="text-yellow-500" />
                                            <span>
                                              {group.reduce((sum, item) => sum + (item.creditsUsed || 0), 0)}
                                            </span>
                                          </div>
                                        </td>
                                        <td>
                                          <button
                                            onClick={() => downloadGroupedEntry(group)}
                                            className="download-btn"
                                            
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="animate-spin h-4 w-4" />
                                            ) : (
                                              <>
                                                <Download className="h-4 w-4" />
                                                <span className="hidden md:inline">Download</span>
                                              </>
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {currentEntries.length === 0 && (
                                    <tr>
                                      <td colSpan="9" className="text-center py-4">
                                        No verification history found
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {sortedGroupedEntries.length > rowsPerPage && (
                              <div className="pagination-controls">
                                <button
                                  onClick={prevPage}
                                  disabled={currentPage === 1}
                                  className={`pagination-btn ${
                                    currentPage === 1 ? "disabled" : ""
                                  }`}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from(
                                  { length: totalPages },
                                  (_, i) => i + 1
                                ).map((number) => (
                                  <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`pagination-btn ${
                                      currentPage === number ? "active" : ""
                                    }`}
                                  >
                                    {number}
                                  </button>
                                ))}

                                <button
                                  onClick={nextPage}
                                  disabled={currentPage === totalPages}
                                  className={`pagination-btn ${
                                    currentPage === totalPages
                                      ? "disabled"
                                      : ""
                                  }`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="no-data">
                            No verification history found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <ToastContainer position="top-center" autoClose={5000} />
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

          </div>
          
        </div>
      </div>
      <style jsx>{`
        
        /* Status Modal */
        .status-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .status-modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1001;
        }

        .status-progress {
          margin: 1rem 0;
        }

        .progress-bar {
          height: 10px;
          background: #e0e0e0;
          border-radius: 5px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4CAF50;
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .status-summary {
          margin: 1.5rem 0;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }

        .status-label {
          font-weight: bold;
        }

        .status-value {
          font-weight: bold;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .status-value.completed {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-value.pending {
          background: #fff8e1;
          color: #ff8f00;
        }

        .completion-message {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 0.5rem;
          border-radius: 4px;
          margin-top: 1rem;
          text-align: center;
        }

        .close-modal-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
          width: 100%;
          transition: background 0.2s;
        }

        .close-modal-btn:hover {
          background: #0b7dda;
        }

        /* Status check button */
        .status-check-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          transition: background 0.2s;
          display: block;
          width: 100%;
        }

        .status-check-btn:hover {
          background: #0b7dda;
        }

        .status-check-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
            .completed-badge {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    display: inline-block;
  }
      `}</style>
    </div>
  );
}

export default VerificationLinks;