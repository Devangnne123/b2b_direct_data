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
  const [creditCost, setCreditCost] = useState(5);
  const [isConfirmationActive, setIsConfirmationActive] = useState(false);
  const dataRef = useRef({ uploadedData: [], credits: null });

  // Handle refresh/back navigation when confirmation is active
  useEffect(() => {
    if (!isConfirmationActive) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "You have pending upload confirmation. Are you sure you want to leave?";
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

  // Restore pending upload on component mount
  useEffect(() => {
    const savedPendingUpload = sessionStorage.getItem("pendingUpload");
    if (savedPendingUpload) {
      try {
        const parsed = JSON.parse(savedPendingUpload);
        setPendingUpload(parsed);
        setShowConfirmation(true);
        setIsConfirmationActive(true);
      } catch (e) {
        sessionStorage.removeItem("pendingUpload");
      }
    }
  }, []);

  const token = sessionStorage.getItem("token");

  const silentRefresh = useCallback(async () => {
    try {
      if (!savedEmail || savedEmail === "Guest") return;

      const [linksRes, creditsRes] = await Promise.all([
        axios.get("http://13.203.218.236:8000/bulklookup/get-links", {
          headers: {
            "user-email": savedEmail,
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`http://13.203.218.236:8000/api/user/${savedEmail}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const now = Date.now();
      const newData = linksRes.data || [];

      // Preserve processing status for items that are still within 1 minute window
      const updatedData = newData.map((item) => {
        const itemTime = new Date(item.date || 0).getTime();
        if (now - itemTime < 60000) {
          // Less than 1 minute old
          return { ...item, status: "pending" };
        }
        return item;
      });

      if (
        JSON.stringify(updatedData) !==
        JSON.stringify(dataRef.current.uploadedData)
      ) {
        setUploadedData(updatedData);
        setFilteredData(updatedData);
        dataRef.current.uploadedData = updatedData;
      }

      if (creditsRes.data.credits !== dataRef.current.credits) {
        setCredits(creditsRes.data.credits);
        dataRef.current.credits = creditsRes.data.credits;
      }
    } catch (error) {
      console.error("Silent refresh error:", error);
    }
  }, [savedEmail]);

  useEffect(() => {
    silentRefresh();
    const intervalId = setInterval(silentRefresh, 10000);
    return () => clearInterval(intervalId);
  }, [silentRefresh]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchCreditCost(user.email);
    }
  }, []);

  // const fetchCreditCost = async (email) => {
  //   try {
  //     const response = await axios.post(
  //       "http://13.203.218.236:8000/users/getAllAdmin",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "X-API-Key": process.env.REACT_APP_API_KEY,
  //         },
  //       }
  //     );
  //     if (response.data && response.data.users) {
  //       const adminUser = response.data.users.find(
  //         (user) => user.userEmail === email
  //       );
  //       if (adminUser) {
  //         setCreditCost(adminUser.creditCostPerLink );
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error fetching admin credit cost:", error);
  //   }
  // };

  // Fetch credits when email changes
   
      const fetchCreditCost = async (email) => {
        if (!email || email === "Guest") return;
        
        try {
          const response = await axios.get(`http://13.203.218.236:8000/api/user/${email}`, {
          headers: {  "Authorization": `Bearer ${token}`  },
        });
          setCredits(response.data.credits);
          setCreditCost(response.data.creditCostPerLink );
          dataRef.current.credits = response.data.credits;
        } catch (error) {
          console.error("Error fetching credits:", error);
          setCredits(0);
        }
      };
  
  

  const getGroupStatus = (group) => {
    if (!group || group.length === 0) return "completed";

    const firstItem = group[0] || {};
    const uniqueId = firstItem.uniqueId;

    // 1. Check processing status first (for recently uploaded files)
    if (processingStatus[uniqueId]) {
      return processingStatus[uniqueId].status;
    }

    // 2. Check timestamp (if any item was created <1 min ago, consider pending)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const hasRecentItems = group.some((item) => {
      const itemTime = new Date(item.date || 0).getTime();
      return itemTime > oneMinuteAgo;
    });
    if (hasRecentItems) return "pending";

    // 3. Check explicit status values from database
    const statuses = group.map((item) => item.status || "not available");

    // Rule 1: If any item is pending → whole group is pending
    if (statuses.includes("pending")) return "pending";

    // Rule 2: If all are "not available" → completed
    if (statuses.every((status) => status === "not available"))
      return "completed";

    // Rule 3: Mixed "completed" and "not available" → completed
    if (statuses.some((status) => status === "completed")) return "completed";

    // Rule 4: If items have match data (mobile, name, etc) → completed
    const hasMatchData = group.some(
      (item) =>
        item.mobile_number ||
        item.mobile_number_2 ||
        item.person_name ||
        item.matchLink
    );
    if (hasMatchData) return "completed";

    // Default case
    return "incompleted";
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please choose a file to upload first");
      return;
    }

    if (!savedEmail || savedEmail === "Guest") {
      return toast.error("Please save your email first");
    }

    if (credits < creditCost) {
      return toast.error("Not enough credits");
    }
    // Example of potential backend limit

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://13.203.218.236:8000/upload-excel",
        formData,
        {
          headers: {
            "user-email": savedEmail,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const totalLinks = res.data.totallink || res.data.totalLinks || 0;
      const uploadData = {
        file: file.name,
        matchCount: res.data.matchCount || 0,
        totallink: totalLinks,
        links: res.data.link,
        uniqueId: res.data.uniqueId,
        creditToDeduct: res.data.matchCount * creditCost,
        timestamp: new Date().toISOString(),
      };

      // Save pending upload to session storage
      sessionStorage.setItem("pendingUpload", JSON.stringify(uploadData));

      setPendingUpload(uploadData);
      setShowConfirmation(true);
      setIsConfirmationActive(true);

      // Set initial status as pending for 1 minute
      setProcessingStatus((prev) => ({
        ...prev,
        [res.data.uniqueId]: {
          status: "pending",
          startTime: Date.now(),
        },
      }));

      // After 1 minute, update status based on actual data
      setTimeout(() => {
        setProcessingStatus((prev) => {
          const group = uploadedData.filter(
            (item) => item.uniqueId === res.data.uniqueId
          );
          const actualStatus = group.some(
            (item) => item.status === "processing"
          )
            ? "processing"
            : group.every((item) => item.matchLink)
            ? "completed"
            : "incompleted";

          return {
            ...prev,
            [res.data.uniqueId]: {
              ...prev[res.data.uniqueId],
              status: actualStatus,
            },
          };
        });
      }, 60000); // 1 minute
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;

    setLoading(true);
    try {
      // First create the TempLinkMobile records
      const tempRes = await axios.post(
        "http://13.203.218.236:8000/confirm-upload",
        {
          uniqueId: pendingUpload.uniqueId,
          email: savedEmail,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then deduct credits
      const creditRes = await axios.post(
        "http://13.203.218.236:8000/api/upload-file",
        {
          userEmail: savedEmail,
          creditCost: pendingUpload.creditToDeduct,
          uniqueId: pendingUpload.uniqueId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCredits(creditRes.data.updatedCredits);
      toast.success(
        `Processing complete! Deducted ${pendingUpload.creditToDeduct} credits`
      );

      // Send email notification
      try {
        await axios.post(
          "http://13.203.218.236:8000/send-upload-notification",
          {
            email: savedEmail,
            fileName: pendingUpload.file,
            totalLinks: pendingUpload.totallink || 0,
            matchCount: pendingUpload.matchCount || 0,
            creditsDeducted: pendingUpload.creditToDeduct,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      sessionStorage.removeItem("pendingUpload");
      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      setIsConfirmationActive(false);
      setShouldRefresh(true);
    } catch (err) {
      toast.error("Failed to confirm processing");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  useEffect(() => {
    if (!shouldRefresh) return;
    const timer = setTimeout(() => {
      window.location.reload();
    }, 20000);
    return () => clearTimeout(timer);
  }, [shouldRefresh]);

  const cancelUpload = async () => {
    if (!pendingUpload?.uniqueId) {
      setShowConfirmation(false);
      setPendingUpload(null);
      setIsConfirmationActive(false);
      return;
    }

    setLoading(true);
    try {
      await axios.delete(
        `http://13.203.218.236:8000/cancel-upload/${pendingUpload.uniqueId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.info("Upload canceled - all data removed");

      // Remove pending upload from session storage
      sessionStorage.removeItem("pendingUpload");

      setProcessingStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[pendingUpload.uniqueId];
        return newStatus;
      });
    } catch (err) {
      toast.error("Failed to completely cancel upload");
      console.error(err);
    } finally {
      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      setLoading(false);
      setShowConfirmation(false);
      setIsConfirmationActive(false);
    }
  };

  function PendingUploadAlert({
    onConfirm,
    onCancel,
    pendingUpload,
    currentCredits,
  }) {
    const totalLinks = pendingUpload.totallink || 0;
    const matchCount = pendingUpload.matchCount || 0;
    const notFoundCount = totalLinks - matchCount;
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
              <span className="horizontal-table-label">Matches Found</span>
              <span className="horizontal-table-value text-success">
                ✅ {matchCount}
              </span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Not Found</span>
              <span className="horizontal-table-value text-danger">
                ❌ {notFoundCount}
              </span>
            </div>

            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Credits to Deduct</span>
              <span className="horizontal-table-value">
                💳 {creditsToDeduct}
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

  return (
    <ErrorBoundary>
      <div className="main">
        {/* Blocking overlay when confirmation is active */}
        {isConfirmationActive && <div className="blocking-overlay"></div>}

        <div className="main-con">
          <Sidebar userEmail={savedEmail} />
          <div className="right-side">
            <div className="right-p">
              <nav className="main-head">
                <div className="main-title">
                  <li className="profile">
                    <p className="title-head">Direct Number Enrichment</p>
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
                              showConfirmation ? "disabled" : ""
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
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                              if (!showConfirmation) {
                                setFile(e.target.files[0]);
                              }
                            }}
                            className="file-input"
                            disabled={showConfirmation || isConfirmationActive}
                            required
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-btn ${
                              showConfirmation || !file || isConfirmationActive
                                ? "disabled"
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
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                        {!file && (
                          <p className="file-required-text">
                            * Please select a file to proceed
                          </p>
                        )}
                      </div>

                      {showConfirmation && pendingUpload && (
                        <PendingUploadAlert
                          onConfirm={confirmUpload}
                          onCancel={cancelUpload}
                          pendingUpload={pendingUpload}
                          currentCredits={credits}
                        />
                      )}

                      {uploadedData.length > 0 && !showConfirmation && (
                        <div className="history-table">
                          <h3 className="section-title">Your Uploaded Files</h3>
                          <p>
                            <strong>Cost per link:</strong> {creditCost} credits
                          </p>

                          {loading ? (
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
                                      <SortableHeader sortKey="totallink">
                                        <LinkIcon className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="matchCount">
                                        <Users className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="status">
                                        <Star className="h-4 w-4" />
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
                                    {currentEntries.map(
                                      ([uniqueId, group], idx) => {
                                        const first = group[0] || {};
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
                                                  {first.fileName || "Unknown"}
                                                </span>
                                              </div>
                                            </td>
                                            <td>{first.totallink || 0}</td>
                                            <td>{first.matchCount || 0}</td>
                                            <td>
                                              <div
                                                className={`status-badge ${
                                                  status === "pending"
                                                    ? "pending"
                                                    : status === "completed"
                                                    ? "completed"
                                                    : "incompleted"
                                                }`}
                                              >
                                                {status === "pending"
                                                  ? "Pending"
                                                  : status === "completed"
                                                  ? "Completed"
                                                  : "Incomplete"}
                                              </div>
                                            </td>
                                            <td>{formatDate(first.date)}</td>
                                            <td>
                                              <div className="flex items-center gap-1">
                                                <FaCoins className="text-yellow-500" />
                                                <span>
                                                  {first.creditDeducted || 0}
                                                </span>
                                              </div>
                                            </td>
                                            <td>
                                              <button
                                                onClick={() =>
                                                  downloadGroupedEntry(group)
                                                }
                                                className="download-btn"
                                              >
                                                <Download className="h-4 w-4" />
                                                <span className="hidden md:inline">
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
                              No statistics found matching your search.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <ToastContainer position="top-center" autoClose={5000} />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default BulkLookup;
