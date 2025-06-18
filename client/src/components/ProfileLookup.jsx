import React, { useState, useEffect } from "react";
import axios from 'axios';
import Sidebar from "../components/Sidebar";
import { IoArrowBackCircle } from "react-icons/io5";
import "../css/ProfileLookup.css";

const ProfileLookup = () => {
  const [matchLink, setMatchLink] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [lookupCount, setLookupCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userEmail = user?.email || "Guest";

  useEffect(() => {
    if (!user) {
      window.location.href = "/";
    } else {
      fetchUserCredits();
      fetchUserStatistics();
    }
  }, []);
const handleSearch = async () => {
  if (!matchLink) return;

  if (lookupCount <= 0) {
    alert("You have no remaining lookups.");
    return;
  }

  setLoading(true);
  setResult(null);
  setNotFound(false);

  try {
    const res = await axios.get(`http://3.109.203.132:8000/api/links/search-match?matchLink=${matchLink}`);

    if (res.data.result) {
      setResult(res.data.result);
      setShowModal(true);

      // Deduct credits and update
      const creditUsed = 5;
      const remainingCredits = Math.max(0, lookupCount - creditUsed);

      await updateUserCredits(remainingCredits);
      setLookupCount(remainingCredits);

      // Save statistics (optional)
      let userStats = JSON.parse(sessionStorage.getItem("statisticsData")) || {};
      const previousLinks = userStats[userEmail]?.uploadedLinks || [];
      const isDuplicate = previousLinks.includes(matchLink);
      const duplicateCount = (userStats[userEmail]?.duplicateCount || 0) + (isDuplicate ? 1 : 0);
      const netNewCount = (userStats[userEmail]?.netNewCount || 0) + (isDuplicate ? 0 : 1);
      const newEnrichedCount = (userStats[userEmail]?.newEnrichedCount || 0) + 1;

      const updatedStats = {
        task: "Search Match",
        email: userEmail,
        filename: matchLink,
        linkUpload: 1,
        duplicateCount,
        netNewCount,
        newEnrichedCount,
        creditUsed,
        remainingCredits,
        uploadedLinks: [...previousLinks, matchLink],
      };

      userStats[userEmail] = updatedStats;
      sessionStorage.setItem("statisticsData", JSON.stringify(userStats));

      await fetch(`http://3.109.203.132:8000/bulkUpload/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(updatedStats),
      });

    } else {
      setNotFound(true);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      setNotFound(true);
    } else {
      console.error("Search error:", error);
    }
  } finally {
    setLoading(false);
  }
};


  // Fetch user credits from the database
  const fetchUserCredits = async () => {
    try {
      const response = await fetch(`http://3.109.203.132:8000/users/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch lookup credits");

      const data = await response.json();
      console.log("API Response:", data);

      // Check if data.users exists and is an array
      const currentUser = data?.users?.find((u) => u.userEmail === userEmail);

      if (currentUser) {
        setLookupCount(currentUser.credits);
      } else {
        console.warn("User not found in API response.");
      }
    } catch (error) {
      console.error("Error fetching lookup credits:", error);
    }
  };

  // Fetch user statistics from sessionStorage
  const fetchUserStatistics = () => {
    let userStats = JSON.parse(sessionStorage.getItem("statisticsData")) || {};
    const userStat = userStats[userEmail] || {};
    setLookupCount(userStat.remainingCredits || lookupCount);
  };

  // Update user credits in the database
  const updateUserCredits = async (newCredits) => {
    try {
      await fetch(`http://3.109.203.132:8000/users/update-credits`, {
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

  // Handle LinkedIn Profile Lookup
  const handleSearch0 = async () => {
    if (!linkedinLink.match(/([a-z]{2,3}\.)?linkedin\.com\/.+$/)) {
      alert("Invalid LinkedIn link. Please try again.");
      return;
    }

    if (lookupCount <= 0) {
      alert("You have no remaining lookups.");
      return;
    }

    try {
      setIsLoading(true);
      const apiUrl = `http://3.109.203.132:8000/mobileEnrichments/mobileEnrichment/single/${encodeURIComponent(
        linkedinLink
      )}`;
      const response = await fetch(apiUrl);

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();

      if (data.data) {
        setResultData(data.data);
        setShowModal(true);

        let userStats =
          JSON.parse(sessionStorage.getItem("statisticsData")) || {};
        let userPreviousSearches = userStats[userEmail]?.uploadedLinks || [];

        const isDuplicate = userPreviousSearches.includes(linkedinLink);
        const duplicateCount =
          (userStats[userEmail]?.duplicateCount || 0) + (isDuplicate ? 1 : 0);
        const netNewCount =
          (userStats[userEmail]?.netNewCount || 0) + (isDuplicate ? 0 : 1);
        const newEnrichedCount =
          (userStats[userEmail]?.newEnrichedCount || 0) + 1;
        const creditUsed = 5;
        const remainingCredits = Math.max(0, lookupCount - 5);

        const updatedStatistics = {
          task: "Profile Lookup",
          email: userEmail,
          filename: linkedinLink,
          linkUpload: 1,
          duplicateCount,
          netNewCount,
          newEnrichedCount,
          creditUsed,
          remainingCredits,
          uploadedLinks: [...userPreviousSearches, linkedinLink],
        };

        userStats[userEmail] = updatedStatistics;
        sessionStorage.setItem("statisticsData", JSON.stringify(userStats));

        await fetch(`http://3.109.203.132:8000/bulkUpload/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(updatedStatistics),
        });

        await updateUserCredits(remainingCredits);
        setLookupCount(remainingCredits);
      } else {
        alert("No data found for the provided LinkedIn URL.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main">
    <div className="main-con">
    {showSidebar && <Sidebar userEmail={userEmail} />} 
    
    <div className="right-side">
        <div className="right-p">
        <nav className="main-head">
          <li className="back1">

            {/* <IoArrowBackCircle className="back1" onClick={() => setShowSidebar(!showSidebar)} />  */}
          </li>
          
          <div className="main-title">
            <li className="profile">
              <p className="title">Profile Lookup</p>
              <li className="credits-main1">
          <h5 className="credits1">
            <img
             
              src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
              alt="external-credits-university-flaticons-flat-flat-icons"
            />
            Credits:{lookupCount}
          </h5>
        </li>

            </li>
            <li>
              <p className="title-des2">
                Retrieve contact and company data in real time using our OSINT methods.
                <br />
                Just provide the input and access the data you need instantly
              </p>
            </li>
            <li className="title-head">
              Explore Real-Time Data
            </li>
          </div>
        </nav>
        <section>
          <div className="main-body0">
            <div className="main-body1">
              <div className="left">
                <div className="left-main">LinkedIn URL</div>
               
                  <div className="url-input">
                    <input type="url" placeholder="Enter your url" 
                     value={matchLink}
                    onChange={(e) => setMatchLink(e.target.value)}
                    />
                  </div>
                 <button className="search-url" onClick={handleSearch} disabled={lookupCount <= 0}>
  {loading ? "Searching..." : "Search"}
</button>
{notFound && <p className="text-red-600 mt-2">No result found.</p>}

                  <div className="url-des">
                    <p>
                      Retrieve all profile or company data on LinkedIn using our LinkedIn Finder URL.
                    </p>
                  </div>
                
              </div>
              <div className="right">
                <img src="linkdin1.png" alt="" />
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>

        {showModal && result && (
          <div className="modal-overlay-1">
            <div className="modal-container-1">
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                 ×
              </button>
              <div className="modal-header-1">
                <h2>LinkedIn Profile Data</h2>
              </div>
              <div className="modal-body-1">
                <div className="info-row-1">
                  <strong>LinkedIn Link:</strong>{" "}
                  <a
                    href={result.matchLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.matchLink || "Not Available"}
                  </a>
                </div>
                <div className="info-row-1">
                  <strong>Full Name:</strong>{" "}
                  <span>{result.person_name || "N/A"}</span>
                </div>
                <div className="info-row-1">
                  <strong>Lead Location:</strong>{" "}
                  <span>
                    {result.person_location || "Not Available"}
                  </span>
                </div>
                <div className="info-row-1">
                  <strong>Mobile 1:</strong>{" "}
                  <span>{result.mobile_number || "Not Available"}</span>
                </div>
                <div className="info-row-1">
                  <strong>Mobile 2:</strong>{" "}
                  <span>{result.mobile_number_2 || "Not Available"}</span>
                </div>
              </div>
              <div className="modal-footer-1">
                <button
                  className="action-button-1"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    
  
);
};

export default ProfileLookup;
