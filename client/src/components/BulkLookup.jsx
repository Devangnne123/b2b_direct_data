import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { IoArrowBackCircle } from "react-icons/io5";
import Sidebar from "../components/Sidebar";
import "../css/BulkLookup.css";

const BulkLookup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [file, setFile] = useState(null);
  const [fileHistory, setFileHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userEmail = user?.email || "Guest";
  const [statistics, setStatistics] = useState(() => {
    const allStats = JSON.parse(sessionStorage.getItem("statisticsData")) || {};
    return (
      allStats[userEmail] || {
        duplicateCount: 0,
        netNewCount: 0,
        newEnrichedCount: 0,
        creditUsed: 0,
        remainingCredits: 0,
        uploadedLinks: [],
      }
    );
  });

  useEffect(() => {
    if (!user) {
      window.location.href = "/";
    } else {
      fetchUserCredits();
    }
  }, []);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(`http://localhost:3000/users/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch lookup credits");
  
      const data = await response.json();
      console.log("API Response:", data); // Debugging log
  
      // Ensure correct data structure
      let usersArray = data?.data || data?.users || data; // Handle different response structures
  
      if (!Array.isArray(usersArray)) {
        console.error("Invalid API response: expected an array but got", usersArray);
        return;
      }
  
      const currentUser = usersArray.find((u) => u.userEmail === userEmail);
      
      if (currentUser) {
        setStatistics((prevState) => ({
          ...prevState,
          remainingCredits: currentUser.credits || 0,
        }));
      } else {
        console.warn("User not found in API response");
      }
    } catch (error) {
      console.error("Error fetching user credits:", error);
    }
  };
  
  

  const updateUserCredits = async (newCredits) => {
    try {
      await fetch(`http://localhost:3000/users/update-credits`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ userEmail, credits: newCredits }),
      });
    } catch (error) {
      console.error("Error updating user credits:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }
  
    if (statistics.remainingCredits <= 0) {
      alert("You have no remaining credits. Please contact support.");
      return;
    }
  
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result;
        let links = [];
  
        if (file.name.endsWith(".csv")) {
          const parsedData = Papa.parse(fileData, { header: false }).data;
          links = parsedData.flat();
        } else if (file.name.endsWith(".xlsx")) {
          const workbook = XLSX.read(fileData, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          links = jsonData.flat();
        }
  
        const linkedinRegex = /([a-z]{2,3}\.)?linkedin\.com\/.+$/;
        const validLinks = links.filter((link) => linkedinRegex.test(link));
  
        if (validLinks.length === 0) {
          alert("No valid LinkedIn links found in the file.");
          return;
        }
  
        setIsLoading(true);
  
        try {
          const apiUrl = `http://localhost:3000/mobileEnrichments/mobileEnrichment?linkedin_url=${validLinks.join(",")}`;
          const response = await fetch(apiUrl);
  
          if (!response.ok) throw new Error("Failed to fetch bulk data");
  
          const data = await response.json();
  
          if (data.data && data.data.length > 0) {
            // Filter only the links that have valid data in the database
            const fetchedLinks = data.data.filter((item) => item !== null);
            const bulkData = fetchedLinks.map((result, index) => ({
              linkedin_url: validLinks[index],
              full_name: result?.full_name || "Not Available",
              lead_location: Array.isArray(result?.lead_location)
                ? result.lead_location.join(", ")
                : result?.lead_location || "Not Available",
              mobile_1: result?.mobile_1 || "Not Available",
              mobile_2: result?.mobile_2 || "Not Available",
            }));
  
            setBulkResults(bulkData);
            await saveStatistics(file.name, fetchedLinks, fetchedLinks.length);
  
            // **Auto-Save the file immediately after fetching**
            await saveFileToDatabase(bulkData);
  
            // Deduct credits only for links that returned data
            const creditDeduction = fetchedLinks.length * 5; // Deduct credits (5 per valid link)
            const newCredits = Math.max(0, statistics.remainingCredits - creditDeduction);
            await updateUserCredits(newCredits);
  
            alert("Bulk data fetched successfully and statistics saved!");
          } else {
            alert("No data found for the provided LinkedIn URLs.");
          }
        } catch (error) {
          console.error("Error fetching bulk data:", error);
          alert("Error fetching bulk data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
  
      if (file.name.endsWith(".csv")) {
        reader.readAsText(file);
      } else if (file.name.endsWith(".xlsx")) {
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again later.");
    }
  };
  

  const saveStatistics = async (filename, validLinks, linkUploadCount) => {
    const userStats =
      JSON.parse(sessionStorage.getItem("statisticsData")) || {};
    const userPreviousUploads = userStats[userEmail]?.uploadedLinks || [];

    const newLinks = validLinks.filter(
      (link) => !userPreviousUploads.includes(link)
    );
    const duplicateLinks = validLinks.filter((link) =>
      userPreviousUploads.includes(link)
    );

    const duplicateCount = statistics.duplicateCount + duplicateLinks.length;
    const netNewCount = statistics.netNewCount + newLinks.length;

    const creditUsed = linkUploadCount * 5;
    const remainingCredits = Math.max(
      0,
      statistics.remainingCredits - creditUsed
    );

    const updatedStatistics = {
      task: "Bulk Lookup",
      email: userEmail,
      filename,
      duplicateCount,
      netNewCount,
      newEnrichedCount: statistics.newEnrichedCount || 0,
      creditUsed,
      remainingCredits,
      uploadedLinks: [...userPreviousUploads, ...newLinks],
      linkUpload: linkUploadCount, // Store the count here
    };

    userStats[userEmail] = updatedStatistics;
    sessionStorage.setItem("statisticsData", JSON.stringify(userStats));

    setStatistics(updatedStatistics);

    try {
      const response = await fetch("http://localhost:3000/bulkUpload/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStatistics),
      });

      if (!response.ok)
        throw new Error(`Error saving statistics: ${response.statusText}`);
      alert("Statistics saved successfully!");
    } catch (error) {
      console.error("Error saving statistics:", error);
      alert(`Error saving statistics: ${error.message}`);
    }
  };

  const handleDownloadExcel = () => {
    if (bulkResults.length === 0) {
      alert("No bulk data available to download.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(bulkResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Data Results");

    XLSX.writeFile(workbook, "Bulk_Data_Results.xlsx");
  };

  const fetchFileHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/excel/history/${userEmail}`
      );
      if (!response.ok) throw new Error("Failed to fetch file history");

      const data = await response.json();
      setFileHistory(data);
    } catch (error) {
      console.error("Error fetching file history:", error);
    }
  };

  useEffect(() => {
    fetchFileHistory();
  }, []);

  const handleDownloadFile = async (filePath) => {
    window.open(`http://localhost:3000/${filePath}`, "_blank");
  };

  const saveFileToDatabase = async (bulkData) => {
    if (bulkData.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(bulkData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Data Results");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const formData = new FormData();
    formData.append("file", blob, "Bulk_Data_Results.xlsx");
    formData.append("userEmail", userEmail); // Pass user email for tracking

    try {
      const response = await fetch("http://localhost:3000/excel/saveFile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to save file");

      alert("File saved successfully in history!");
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Error saving file to database.");
    }
  };

  return (
    <div className="main1">
    <div className="main-con1">
    {showSidebar && <Sidebar userEmail={userEmail} />} 

      <div className="main-content1">
        <div className="right-side1">
          <div className="right-p1">
            <nav className="main-head1">
              <li>
                <IoArrowBackCircle className="back1" onClick={() => setShowSidebar(!showSidebar)} />  
              </li>
              
              <div className="main-title1">
                <li className="profile">
                  <p className="title1">Bulk Lookup</p>
                  <li className="credits-main">
            <h5 className="credits">
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                alt="external-credits-university-flaticons-flat-flat-icons"
              />
              Credits:{statistics.remainingCredits}
            </h5>
          </li>
                </li>
                <li>
                  <p className="title-des1">
                    Enrich your data in bulk with our lookup tool
                  </p>
                </li>
                <li className="big1">
                  <h1 className="title-head1">Bulk Data in Real-Time</h1>
                </li>
              </div>
            </nav>
            <section>
              <div className="main-body11">
                <div className="main-body111">
                  <div className="left1">
                    <div className="left-main1">Linkedin URL Excel File</div>
                     
                      <div className="url-input1">
                        <div className="form">
                        <label htmlFor="file-input" className="label">
                          Choose File
                        </label>
                        {file && <span className="file-name">{file.name}</span>}

                        <input
                          type="file"
                          placeholder="Choose file"
                          id="file-input"
                          accept=".csv,.xlsx"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                        </div>

                        <button
                          className="search-url1"
                          onClick={handleFileUpload}
                        >
                          {isLoading ? "Uploading..." : "Upload & Fetch"}
                        </button>

                        {bulkResults.length > 0 && (
                          <button
                            className="download-button"
                            onClick={handleDownloadExcel}
                          >
                            Download Excel
                          </button>
                        )}
                      </div>
                     

                      
                    <div className="url-des1">
                      <p>
                        Retrieve all profile or company data on LinkedIn using
                        our LinkedIn Finder URL.
                      </p>
                    </div>
                    <div className="history-table">
                    <table border="1">
          <thead >
            <tr  >
              <th className="header12">File Name</th>
              <th className="header12">Uploaded At</th>
              <th className="header12">Action</th>
            </tr>
          </thead>
          <tbody>
            {fileHistory.map((file) => (
              <tr key={file._id}>
                <td>{file.fileName}</td>
                <td>{new Date(file.uploadedAt).toLocaleString()}</td>
                <td>
                  <button className="download-button1" onClick={() => handleDownloadFile(file.filePath)}>
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
                  </div>
                  <div className="right1">
                    <img src="new linkedin.png" alt="" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
export default BulkLookup;
