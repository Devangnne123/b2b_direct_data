import React, { useState, useEffect } from "react";
import { Download, Calendar, Users, Link as LinkIcon, FileSpreadsheet, Star, Database, Loader2 } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import "../css/UserS.css";

const UserStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [fileHistory, setFileHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          const errorText = await response.text();
          throw new Error(`Failed to fetch statistics: ${errorText}`);
        }
    
        const data = await response.json();
        console.log("✅ User Statistics Response:", data);
    
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
        console.log("File History Response:", data);
    
        setFileHistory(data);
      } catch (error) {
        console.error("Error fetching file history:", error);
      }
    };

    fetchUserStatistics();
    fetchFileHistory();
  }, [userEmail]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const findMatchingFile = (statDate) => {
    return fileHistory.find(
      (file) => formatDate(file.uploadedAt) === formatDate(statDate)
    );
  };

  const handleDownloadFile = async (filePath) => {
    window.open(`http://localhost:3000/${filePath}`, "_blank");
  };

  return (
    <div className="dashboard">
      <Sidebar userEmail={userEmail} />

      <div className="main-content">
        <div className="header">
          <h1 className="profile-lookup">Statistics (Last 3 Months)</h1>
        </div>

        <div className="statistics-page">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              <p className="text-gray-600 mt-2">Loading statistics...</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="desktop-view">
                <div className="table-wrapper">
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
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td>{index + 1}</td>
                              <td>
                                <div className="task-cell">
                                  {stat.task === "Bulk Upload" ? (
                                    <FileSpreadsheet className="icon-blue" />
                                  ) : (
                                    <LinkIcon className="icon-green" />
                                  )}
                                  <span>{stat.task}</span>
                                </div>
                              </td>
                              <td>{formatDate(stat.date)}</td>
                              <td className="max-w-xs truncate">{stat.filename}</td>
                              <td>{stat.linkUpload}</td>
                              <td>{stat.duplicateCount}</td>
                              <td>{stat.netNewCount}</td>
                              <td>{stat.newEnrichedCount}</td>
                              <td>{stat.creditUsed}</td>
                              <td>{stat.remainingCredits}</td>
                              <td>
                                {stat.filename && stat.filename.includes("linkedin.com") ? (
                                  ""
                                ) : matchingFile ? (
                                  <button
                                    onClick={() => handleDownloadFile(matchingFile.filePath)}
                                    className="download-btn"
                                  >
                                    <Download className="h-4 w-4" />
                                    <span>Download</span>
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
              </div>

              {/* Mobile View */}
              <div className="mobile-view">
                {statistics.length > 0 ? (
                  statistics.map((stat, index) => {
                    const matchingFile = findMatchingFile(stat.date);
                    return (
                      <div key={index} className="stat-card">
                        <div className="card-header">
                          <div className="task-info">
                            {stat.task === "Bulk Upload" ? (
                              <FileSpreadsheet className="icon-blue" />
                            ) : (
                              <LinkIcon className="icon-green" />
                            )}
                            <span className="task-name">{stat.task}</span>
                          </div>
                          <div className="date-badge">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(stat.date)}</span>
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="stat-row">
                            <span className="stat-label">File:</span>
                            <span className="stat-value truncate">{stat.filename}</span>
                          </div>
                          <div className="stats-grid">
                            <div className="stat-item">
                              <Users className="h-4 w-4" />
                              <span>Duplicates: {stat.duplicateCount}</span>
                            </div>
                            <div className="stat-item">
                              <Database className="h-4 w-4" />
                              <span>New: {stat.netNewCount}</span>
                            </div>
                            <div className="stat-item">
                              <Star className="h-4 w-4" />
                              <span>Enriched: {stat.newEnrichedCount}</span>
                            </div>
                          </div>
                          <div className="credits-section">
                            <div className="credits-info">
                              <span>Credits Used: {stat.creditUsed}</span>
                              <span>Remaining: {stat.remainingCredits}</span>
                            </div>
                            {!stat.filename.includes("linkedin.com") && matchingFile && (
                              <button
                                onClick={() => handleDownloadFile(matchingFile.filePath)}
                                className="mobile-download-btn"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <p>No statistics available for the last 3 months.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;