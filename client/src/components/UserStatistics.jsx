import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar"; // Import Sidebar
import "../css/UserStatistic.css"; // Import external styles

const UserStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [fileHistory, setFileHistory] = useState([]); // Store file history
  const [loading, setLoading] = useState(false);

  // Retrieve the logged-in user's email
  const userEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  // Redirect to login if the user is not authenticated
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const fetchUserStatistics = async () => {
      if (!userEmail || userEmail === "Guest") return;
    
      setLoading(true);
    
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const formattedDate = threeMonthsAgo.toISOString();
    
        console.log("🔍 Fetching User Statistics for:", userEmail);
        console.log("📅 From Date:", formattedDate);
    
        const response = await fetch(
          `http://localhost:3000/bulkUpload/userStatistics?email=${userEmail}&fromDate=${formattedDate}`
        );
    
        if (!response.ok) {
          const errorText = await response.text(); // Get error message
          throw new Error(`Failed to fetch statistics: ${errorText}`);
        }
    
        const data = await response.json();
        console.log("✅ User Statistics Response:", data); // Debug API response
    
        setStatistics(data.length > 0 ? data : []);
      } catch (err) {
        console.error("❌ Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    
    

    const fetchFileHistory = async () => {
      if (!userEmail || userEmail === "Guest") return;
    
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const formattedDate = threeMonthsAgo.toISOString();
    
        console.log("Fetching File History:", userEmail, "From Date:", formattedDate);
    
        const response = await fetch(
          `http://localhost:3000/excel/history/${userEmail}?fromDate=${formattedDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch file history");
    
        const data = await response.json();
        console.log("File History Response:", data); // ✅ Check API response
    
        setFileHistory(data);
      } catch (error) {
        console.error("Error fetching file history:", error);
      }
    };
    

    fetchUserStatistics();
    fetchFileHistory();
  }, [userEmail]);

  // Function to format date to dd-mm-yy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Function to find the matching file for a statistic row based on date
  const findMatchingFile = (statDate) => {
    return fileHistory.find(
      (file) => formatDate(file.uploadedAt) === formatDate(statDate)
    );
  };

  // Function to handle file download
  const handleDownloadFile = async (filePath) => {
    window.open(`http://localhost:3000/${filePath}`, "_blank");
  };

  return (
    <div className="dashboard">
      {/* Sidebar Component */}
      <Sidebar userEmail={userEmail} />

      {/* Main Content */}
      <div className="main-content">
        {/* Header Section */}
        <div className="header">
          <h1 className="profile-lookup">Statistics (Last 3 Months)</h1>
        </div>

        <div className="statistics-page">
          {loading ? (
            <p>Loading statistics...</p>
          ) : (
            <div className="table-container">
              <table className="statistics-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Task</th>
                    <th>Date</th>
                    <th>File Name / LinkedIn Link</th>
                    <th>Link Upload</th>
                    <th>Duplicate Count</th>
                    <th>Net New Count</th>
                    <th>New Enriched Count</th>
                    <th>Credits Used</th>
                    <th>Remaining Credits</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.length > 0 ? (
                    statistics.map((stat, index) => {
                      const matchingFile = findMatchingFile(stat.date);
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{stat.task}</td>
                          <td>{formatDate(stat.date)}</td>
                          <td>{stat.filename}</td>
                          <td>{stat.linkUpload}</td>
                          <td>{stat.duplicateCount}</td>
                          <td>{stat.netNewCount}</td>
                          <td>{stat.newEnrichedCount}</td>
                          <td>{stat.creditUsed}</td>
                          <td>{stat.remainingCredits}</td>
                          <td>
                            {stat.filename &&
                            stat.filename.includes("linkedin.com") ? (
                              "" // If the filename contains LinkedIn, leave the cell empty
                            ) : matchingFile ? (
                              <button
                                onClick={() =>
                                  handleDownloadFile(matchingFile.filePath)
                                }
                              >
                                Download
                              </button>
                            ) : (
                              "No File"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="no-data">
                        No statistics available for the last 3 months.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
