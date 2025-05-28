import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Usertrans from "../components/Usertrans";
import { ToastContainer, toast } from "react-toastify";
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
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [uploadedData, setUploadedData] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);
  const [deductedCreditsMap, setDeductedCreditsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loadingcost, setLoadingcost] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
   const [creditCost, setCreditCost] = useState(null);



  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchUserLinks(user.email);
      fetchCredits(user.email);
      // fetchCreditCost(user.email);
    }
  }, []);

  useEffect(() => {
    const savedPendingUpload = localStorage.getItem("pendingUpload");
    if (savedPendingUpload) {
      setPendingUpload(JSON.parse(savedPendingUpload));
      setShowConfirmation(true);
    }
  }, []);



   useEffect(() => {
    const fetchAdminCreditCost = async () => {
      try {
        const response = await axios.get("http://3.6.160.211:8000/users/getAllAdmin");
        if (response.data && response.data.users) {
          // Find the admin user matching the current email
          const adminUser = response.data.users.find(
            (user) => user.userEmail === savedEmail
          );
          if (adminUser) {
            setCreditCost(adminUser.creditCostPerLink || 5);
          }
        }
      } catch (error) {
        console.error("Error fetching admin credit cost:", error);
        toast.error("Failed to load credit cost settings");
      } finally {
        setLoadingCost(false);
      }
    };

    if (savedEmail && savedEmail !== "Guest") {
      fetchAdminCreditCost();
    }
  }, [savedEmail]);


// const fetchCreditCost = async (email) => {
//   if (!email) {
//     console.error('Email is required');
//     return;
//   }

//   setLoadingcost(true);
  
//   try {
//     const response = await axios.get('http://3.6.160.211:8000http://3.6.160.211:8000/credit-cost', {
//       params: { email } // This will create http://3.6.160.211:8000/credit-cost?email=user@example.com
//     });
    
//     setCreditCost(response.data.creditCostPerLink);
//   } catch (err) {
//     console.error('Error fetching credit cost:', err);
//     toast.error(err.response?.data?.message || 'Failed to fetch credit cost');
//   } finally {
//     setLoadingcost(false);
//   }
// };



  useEffect(() => {
    if (pendingUpload) {
      localStorage.setItem("pendingUpload", JSON.stringify(pendingUpload));
    } else {
      localStorage.removeItem("pendingUpload");
    }
  }, [pendingUpload]);

  const getGroupStatus = (group) => {
  if (!group || group.length === 0) return "completed"; // Changed to "completed"
  
  const firstItem = group[0] || {};
  
  // Explicitly check for matchCount === 0 and return "completed"
  if (firstItem.matchCount === 0) return "completed"; 
  
  if (group.some((item) => item.status === "pending")) {
    return "pending";
  }
  if (group.some((item) => !item.matchLink)) {
    return "incompleted";
  }
  return "completed";
};

  const fetchCredits = async (email) => {
    try {
      const res = await axios.get(`http://3.6.160.211:8000http://3.6.160.211:8000/user/${email}`);
      setCredits(res.data.credits);
    } catch (err) {
      toast.error("Failed to fetch credits");
      console.error(err);
    }
  };

  const handleEmailSave = () => {
    if (!email.trim()) return toast.error("Please enter a valid email");
    const user = { email };
    sessionStorage.setItem("user", JSON.stringify(user));
    setSavedEmail(email);
    toast.success("Email saved successfully!");
    fetchUserLinks(email);
    fetchCredits(email);
  };

  const fetchUserLinks = async (email) => {
    setLoading(true);
    try {
      const res = await axios.get("http://3.6.160.211:8000/get-links", {
        headers: { "user-email": email },
      });
      setUploadedData(res.data || []);
      setFilteredData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch uploaded links");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startProcessing = (uniqueId) => {
    setProcessingStatus(prev => ({...prev, [uniqueId]: true}));
    setTimeout(() => {
      setProcessingStatus(prev => {
        const newState = {...prev};
        delete newState[uniqueId];
        return newState;
      });
    }, 15000);
  };

 const handleUpload = async () => {
  if (!file) return toast.error("Please choose a file to upload.");
  if (!savedEmail || savedEmail === "Guest")
    return toast.error("Please save your email first");
  if (credits < creditCost) return toast.error("Not enough credits");

  setLoading(true);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(
      "http://3.6.160.211:8000/upload-excel",
      formData,
      { headers: { "user-email": savedEmail } }
    );

    // Calculate total credits to deduct based on creditCostPerLink (5 per link)
    const totalLinks = res.data.totallink || res.data.totalLinks || 0;
   

    const uploadData = {
      file: file.name,
      matchCount: res.data.matchCount || 0,
      totallink: totalLinks,
      uniqueId: res.data.uniqueId,
      creditToDeduct: res.data.matchCount * creditCost,
      timestamp: new Date().toISOString(),
    };
    
    setPendingUpload(uploadData);
    setShowConfirmation(true);
    startProcessing(res.data.uniqueId);
  } catch (err) {
    toast.error(err.response?.data?.message || "Upload failed");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const confirmUpload = async () => {
    if (!pendingUpload) return;

    setLoading(true);
    try {
      const creditRes = await axios.post(
        "http://3.6.160.211:8000http://3.6.160.211:8000/upload-file",
        {
          userEmail: savedEmail,
          creditCost: pendingUpload.creditToDeduct,
          uniqueId: pendingUpload.uniqueId,
          
        }
      );

      const newCredits = creditRes.data.updatedCredits;
      setCredits(newCredits);

      toast.success(
        `Processing complete! Deducted ${pendingUpload.creditToDeduct} credits`
      );

      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      await fetchUserLinks(savedEmail);
    } catch (err) {
      toast.error("Failed to confirm processing");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const cancelUpload = async () => {
    if (!pendingUpload?.uniqueId) {
      setShowConfirmation(false);
      setPendingUpload(null);
      return;
    }

    setLoading(true);
    try {
      await axios.delete(
        `http://3.6.160.211:8000/cancel-upload/${pendingUpload.uniqueId}`
      );
      toast.info("Upload canceled - all data removed");
    } catch (err) {
      toast.error("Failed to completely cancel upload");
      console.error(err);
    } finally {
      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      setLoading(false);
      setShowConfirmation(false);
    }
  };

 function PendingUploadAlert({ onConfirm, onCancel, pendingUpload, currentCredits }) {
  const totalLinks = pendingUpload.totallink || 0;
  const matchCount = pendingUpload.matchCount || 0;
  const notFoundCount = totalLinks - matchCount;
  const creditsToDeduct = pendingUpload.creditToDeduct || 0;
  const remainingCredits = currentCredits - creditsToDeduct;

 return (
 <div className="modal-container">
  <h3 className="modal-heading">Confirm Upload</h3>

  <div className="modal-content-space">
    <p className="text-gray-800">You have an unconfirmed upload:</p>

    <div className="info-box">
      <p><strong>📄 File:</strong> {pendingUpload.file}</p>
      <p><strong>🔗 Total Links:</strong> {totalLinks}</p>
      <p className="text-green-600"><strong>✅ Matches Found:</strong> {matchCount}</p>
      <p className="text-red-600"><strong>❌ Not Found:</strong> {notFoundCount}</p>
      <p><strong>💳 Credits to Deduct:</strong> {creditsToDeduct}</p>
      <p className="font-bold"><strong>🧮 Remaining Credits:</strong> {remainingCredits}</p>
    </div>

    <p className="text-sm text-gray-600 text-center">
      This dialog will persist until you choose an option.
    </p>
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
      style={remainingCredits < 0 ? {backgroundColor: '#9ca3af', cursor: 'not-allowed'} : {}}
    >
      <span>✅</span>
      <span>Confirm & Process</span>
    </button>
  </div>
</div>

);
 }
  const handleSearch = () => {
    if (searchId.trim() === "") {
      setFilteredData(uploadedData);
    } else {
      const result = uploadedData.filter((item) =>
        item?.uniqueId?.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredData(result || []);
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
  }, [filteredData, sortConfig]);

  const downloadGroupedEntry = (group) => {
    const sortedGroup = [...group].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateA - dateB;
    });

    const rowData = sortedGroup.map((entry) => {
      const matchLink = entry?.matchLink || null;

      const mobile_number = entry?.mobile_number || "N/A";
      const mobile_number_2 = entry?.mobile_number_2 || "N/A";
      const person_name = entry?.person_name || "N/A";
      const person_location = entry?.person_location || "N/A";

      let status = "Completed";

      if (!matchLink) {
        status = "Incompleted";
      } else if (mobile_number === "N/A") {
        status = "Pending";
      }

      return {
        fileName: entry?.fileName || "Unknown",
        uniqueId: entry?.uniqueId || "Unknown",
        matchCount: entry?.matchCount || 0,
        totallinks: entry?.totallink || 0,
        date: entry?.date ? new Date(entry.date).toLocaleString() : "Unknown",
        status,
        link: matchLink || "N/A",
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
    <div className="main-con">
      {showSidebar && <Sidebar userEmail={savedEmail} />}

      <div className="right-side">
        <div className="right-p">
          <nav className="main-head">
            <li className="back1">
              {/* Optional Back Button */}
            </li>
            <div className="main-title">
              <li className="profile">
                <p className="title-head">LinkedIn Company Details Lookup</p>
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
              <li>
                {/* <p className="title-des2">
                  Upload a file containing LinkedIn company URLs to fetch company details such as size, industry, and location.
                </p> */}
              </li>
              {/* <h1 className="title-head">LinkedIn Company Details Lookup</h1> */}
            </div>
          </nav>

          <section>
            <div className="main-body0">
              <div className="main-body1">
                <div className="left">
                  <div className="upload-section">
                    <div className="history-table">
                      {/* <h3 className="section-title">Company Lookup History</h3>
                      <p><strong>Cost per link:</strong> {creditCost} credits</p> */}

                      <div className="coming-soon-message text-center py-10">
                        <h2 className="text-2xl font-semibold text-gray-700">🏢 LinkedIn Company Lookup Coming Soon!</h2>
                        <p className="text-gray-500 mt-2">
                          You’ll soon be able to upload LinkedIn company links and retrieve insights such as industry, employee count, and headquarters location.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* <TempLinkMobileForm /> */}
          {/* <SingleLinkLookup /> */}
          
          <ToastContainer position="top-center" autoClose={5000} />
        </div>
      </div>
    </div>
  </div>
</ErrorBoundary>

   
  );
}

export default BulkLookup;
