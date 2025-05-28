import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import TempLinkMobileForm from "../components/TempLinkMobileForm";
import SingleLinkLookup from "../components/SingleLinkLookup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCoins, FaRegCreditCard } from 'react-icons/fa';
import { Download, Calendar, Users, Link as LinkIcon, FileSpreadsheet, Star, Database, Loader2, ChevronLeft, ChevronRight, CreditCard, Hash } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import "../css/BulkLookup.css";
import "../css/UserS.css";

function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [uploadedData, setUploadedData] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);
  const [deductedCreditsMap, setDeductedCreditsMap] = useState({}); // NEW

  const creditCost = 5;

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchUserLinks(user.email);
      fetchCredits(user.email);
    }
  }, []);

  const fetchCredits = async (email) => {
    try {
      const res = await axios.get(`http://localhost:8000http://localhost:8000/user/${email}`);
      setCredits(res.data.credits);
    } catch (err) {
      alert("Failed to fetch credits");
      console.error(err);
    }
  };

  const handleEmailSave = () => {
    if (!email.trim()) return alert("Please enter a valid email");
    const user = { email };
    sessionStorage.setItem("user", JSON.stringify(user));
    setSavedEmail(email);
    toast.success("Email saved!");
    fetchUserLinks(email);
    fetchCredits(email);
  };

  const fetchUserLinks = async (email) => {
    try {
      const res = await axios.get("http://localhost:8000/get-links", {
        headers: { "user-email": email },
      });
      setUploadedData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a file to upload.");
    if (!savedEmail || savedEmail === "Guest")
      return alert("Please save your email first");
    if (credits < creditCost) return toast.error("Not enough credits");


    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8000/upload-excel",
        formData,
        {
          headers: { "user-email": savedEmail },
        }
      );

      const { matchCount, uniqueId } = res.data;
      const creditToDeduct = matchCount * creditCost;

      const creditRes = await axios.post(
        "http://localhost:8000http://localhost:8000/upload-file",
        {
          userEmail: savedEmail,
          creditCost: creditToDeduct,
          uniqueId, // Include in backend request to track per upload
        }
      );

      const newCredits = creditRes.data.updatedCredits;
      setCredits(newCredits);

      // Update map with new value
      setDeductedCreditsMap((prev) => ({
        ...prev,
        [uniqueId]: creditToDeduct,
      }));

      

      toast.success(
        <div>
          <h4>✅ Upload Successful!</h4>
          <table style={{ width: '100%', marginTop: 10, border: '1px solid #ccc', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>📌 Unique ID:</strong></td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{uniqueId}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>💳 Credits Deducted:</strong></td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{creditToDeduct}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}><strong>💸 Remaining Credits:</strong></td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{newCredits}</td>
              </tr>
            </tbody>
          </table>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
          
        }
      );
      













      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      fetchUserLinks(savedEmail);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");

      console.error(err);
    }
  };

  const handleSearch = () => {
    if (searchId.trim() === "") {
      setFilteredData(uploadedData);
    } else {
      const result = uploadedData.filter((item) =>
        item.uniqueId.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredData(result);
    }
  };

  const groupByUniqueId = (data) => {
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.uniqueId]) grouped[item.uniqueId] = [];
      grouped[item.uniqueId].push(item);
    });
    return grouped;
  };

  const downloadGroupedEntry = (group) => {
    const rowData = group.map((entry) => ({
      fileName: entry.fileName,
      uniqueId: entry.uniqueId,
      matchCount: entry.matchCount || 0,
      totallinks: entry.totallink,
      date: new Date(entry.date).toLocaleString(),
      link: entry.matchLink || null,
      mobile_number: entry.mobile_number || null,
      mobile_number_2: entry.mobile_number_2 || null,
      person_name: entry.person_name || null,
      person_location: entry.person_location || null,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LinkData");
    XLSX.writeFile(workbook, `LinkData_${group[0].uniqueId}.xlsx`);
  };

  const groupedData = groupByUniqueId(filteredData);

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Excel with LinkedIn Links</h2>

      <div style={{ marginBottom: 20 }}>
        <label>
          Enter your email:{" "}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button onClick={handleEmailSave} style={{ marginLeft: 10 }}>
          Save Email
        </button>
      </div>

      <p>
        <strong>Logged in as:</strong> {savedEmail}
      </p>
      <p>
        <strong>Remaining Credits:</strong>{" "}
        {credits !== null ? credits : "Loading..."}
      </p>

      <label htmlFor="file-input" className="label">
        Choose File
      </label>
      {file && <span className="file-name">{file.name}</span>}
      <input
        type="file"
        id="file-input"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        onClick={handleUpload}
        style={{ marginLeft: 10 }}
        disabled={!savedEmail || savedEmail === "Guest" || credits < creditCost}
      >
        Upload File
      </button>

      {uploadedData.length > 0 && (
        <>
          <hr />
          <h3>Search Your Uploaded Files</h3>
          <input
            type="text"
            placeholder="Search by UniqueId"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{ marginRight: 10 }}
          />
          <button onClick={handleSearch}>Search</button>

          <h3 style={{ marginTop: 20 }}>Grouped Uploaded Link Data</h3>

          {Object.entries(groupedData).map(([uniqueId, group], idx) => {
            const first = group[0];
            const thisDeducted = deductedCreditsMap[uniqueId] || "N/A";

            return (
              <div
                key={idx}
                style={{
                  marginBottom: 30,
                  border: "1px solid #ccc",
                  padding: 15,
                }}
              >
                <h4>UniqueId: {uniqueId}</h4>
                <p>
                  <strong>File Name:</strong> {first.fileName}
                </p>
                <p>
                  <strong>Total Links:</strong> {first.totallink}
                </p>
                <p>
                  <strong>Match Count:</strong> {first.matchCount}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(first.date).toLocaleString()}
                </p>
                <p>
                  <strong>Credits deducted:</strong> {first.creditDeducted}
                </p>
                <p>
                  <strong>Remaining Credits:</strong> {first.remainingCredits}
                </p>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #999" }}>Link</th>
                      <th style={{ border: "1px solid #999" }}>
                        Mobile Number
                      </th>
                      <th style={{ border: "1px solid #999" }}>
                        Mobile Number 2
                      </th>
                      <th style={{ border: "1px solid #999" }}>Person Name</th>
                      <th style={{ border: "1px solid #999" }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((entry, i) => (
                      <tr key={i}>
                        <td style={{ border: "1px solid #ccc" }}>
                          <a
                            href={entry.matchLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {entry.matchLink}
                          </a>
                        </td>
                        <td style={{ border: "1px solid #ccc" }}>
                          {entry.mobile_number || ""}
                        </td>
                        <td style={{ border: "1px solid #ccc" }}>
                          {entry.mobile_number_2 || ""}
                        </td>
                        <td style={{ border: "1px solid #ccc" }}>
                          {entry.person_name || ""}
                        </td>
                        <td style={{ border: "1px solid #ccc" }}>
                          {entry.person_location || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={() => downloadGroupedEntry(group)}
                  style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "5px 10px",
                    marginTop: 10,
                  }}
                >
                  Download Group as Excel
                </button>
              </div>
            );
          })}
        </>
      )}
      <TempLinkMobileForm />
      <SingleLinkLookup />

      <ToastContainer position="top-center" autoClose={10000} />

    </div>
    
  );
}

export default App;
