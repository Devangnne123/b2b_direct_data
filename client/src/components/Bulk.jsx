import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import TempLinkMobileForm from '../components/TempLinkMobileForm';

function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('Guest');
  const [uploadedData, setUploadedData] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.email) {
      setSavedEmail(user.email);
      fetchUserLinks(user.email);
      fetchUserCredits(user.email);
    }
  }, []);

  const handleEmailSave = () => {
    if (!email.trim()) return alert('Please enter a valid email');
    const user = { email };
    sessionStorage.setItem('user', JSON.stringify(user));
    setSavedEmail(email);
    alert('Email saved!');
    fetchUserLinks(email);
    fetchUserCredits(email);
  };

  const fetchUserLinks = async (email) => {
    try {
      const res = await axios.get('http://localhost:3000/get-links', {
        headers: { 'user-email': email },
      });
      setUploadedData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserCredits = async (email) => {
    try {
      const res = await axios.get(`http://localhost:3000/users/user`, {
        headers: { 'user-email': email },
      });

      const data = res.data;
      let userData = data?.data || data?.user || data;
      if (!userData) return;

      setCredits(userData.credits || 0);
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('Choose a file');
    if (!savedEmail || savedEmail === 'Guest') return alert('Please save your email first');
    if (credits <= 0) return alert('Insufficient credits. Please add more credits before uploading.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:3000/upload-excel', formData, {
        headers: { 'user-email': savedEmail },
      });

      const { uniqueId, matchCount, deductedCredits } = res.data;

      alert(`Upload success! Unique ID: ${uniqueId}\nMatched Links: ${matchCount || 0}\nCredits Deducted: ${deductedCredits || 0}`);
      fetchUserLinks(savedEmail);
      fetchUserCredits(savedEmail);

      setFile(null);
      document.querySelector('input[type="file"]').value = null;
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleSearch = () => {
    if (searchId.trim() === '') {
      setFilteredData(uploadedData);
    } else {
      const result = uploadedData.filter(item =>
        item.uniqueId.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredData(result);
    }
  };

  const downloadSingleEntry = (entry) => {
    const rowData = [{
      fileName: entry.fileName,
      uniqueId: entry.uniqueId,
      totalLinks: entry.totalLinks,
      matchCount: entry.matchCount || 0,
      deductedCredits: entry.deductedCredits || 0,
      date: new Date(entry.date).toLocaleString(),
      links: (entry.links || []).join(', '),
      mobile_numbers: (entry.mobile_numbers || []).join(', '),
      mobile_numbers_2: (entry.mobile_numbers_2 || []).join(', '),
      person_names: (entry.person_names || []).join(', '),
      person_locations: (entry.person_locations || []).join(', '),
    }];

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SingleLinkData');

    const filename = `LinkData_${entry.uniqueId}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Excel with LinkedIn Links</h2>

      <div style={{ marginBottom: 20 }}>
        <label>
          Enter your email:{' '}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button onClick={handleEmailSave} style={{ marginLeft: 10 }}>Save Email</button>
      </div>

      <p><strong>Logged in as:</strong> {savedEmail}</p>
      {credits !== null && (
        <p><strong>Remaining Credits:</strong> {credits}</p>
      )}

      <label htmlFor="file-upload" style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Choose File
      </label>
      <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={e => setFile(e.target.files[0])} />
      <button
        onClick={handleUpload}
        style={{ marginLeft: 10 }}
        disabled={!savedEmail || savedEmail === 'Guest'}
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
            onChange={e => setSearchId(e.target.value)}
            style={{ marginRight: 10 }}
          />
          <button onClick={handleSearch}>Search</button>

          <h3 style={{ marginTop: 20 }}>Your Uploaded Link Data</h3>
          {filteredData.map((entry, idx) => (
            <div key={idx} style={{ marginBottom: 15, border: '1px solid #ccc', padding: 10 }}>
              <p><strong>File Name:</strong> {entry.fileName}</p>
              <p><strong>UniqueId:</strong> {entry.uniqueId}</p>
              <p><strong>Total Links:</strong> {entry.totalLinks}</p>
              <p><strong>Matched Links:</strong> {entry.matchCount || 0}</p>
              <p><strong>Deducted Credits:</strong> {entry.deductedCredits || 0}</p>
              <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>

              <p><strong>Mobile Numbers:</strong> {(entry.mobile_numbers || []).join(', ')}</p>
              <p><strong>Mobile Numbers 2:</strong> {(entry.mobile_numbers_2 || []).join(', ')}</p>
              <p><strong>Person Names:</strong> {(entry.person_names || []).join(', ')}</p>
              <p><strong>Person Locations:</strong> {(entry.person_locations || []).join(', ')}</p>

              <ul>
                {(entry.links || []).map((link, i) => (
                  <li key={i}><a href={link} target="_blank" rel="noreferrer">{link}</a></li>
                ))}
              </ul>
              <button
                onClick={() => downloadSingleEntry(entry)}
                style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', marginTop: 10 }}
              >
                Download This as Excel
              </button>
            </div>
          ))}
        </>
      )}

      <TempLinkMobileForm />
    </div>
  );
}

export default App;
