import React, { useState } from 'react';

const UpdateLinkDetails = () => {
  const [uniqueId, setUniqueId] = useState('');
  const [matchLinks, setMatchLinks] = useState([]);
  const [mobileNumbers, setMobileNumbers] = useState([]);
  const [mobileNumbers2, setMobileNumbers2] = useState([]);
  const [personNames, setPersonNames] = useState([]);
  const [personLocations, setPersonLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    if (!uniqueId) return alert('Please enter a Unique ID');

    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/get-templink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId }),
      });

      if (!res.ok) {
        setMessage('No record found');
        setMatchLinks([]);
        return;
      }

      const data = await res.json();
      setMatchLinks(data.matchLinks || []);
      setMobileNumbers(data.mobile_numbers || Array(data.matchLinks.length).fill(''));
      setMobileNumbers2(data.mobile_numbers_2 || Array(data.matchLinks.length).fill(''));
      setPersonNames(data.person_names || Array(data.matchLinks.length).fill(''));
      setPersonLocations(data.person_locations || Array(data.matchLinks.length).fill(''));
      setMessage('');
    } catch (error) {
      console.error(error);
      setMessage('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (setter, index, value) => {
    setter(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!uniqueId || matchLinks.length === 0) {
      return alert('No matchLinks to save');
    }

    try {
      const res = await fetch('http://localhost:3000/api/update-templink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueId,
          matchLinks,
          mobile_numbers: mobileNumbers,
          mobile_numbers_2: mobileNumbers2,
          person_names: personNames,
          person_locations: personLocations,
        }),
      });

      const data = await res.json();
      setMessage(data.message || 'Data saved successfully');
    } catch (err) {
      console.error(err);
      setMessage('Failed to save data');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Search and Update LinkedIn Link Details</h2>

      <div>
        <input
          type="text"
          placeholder="Enter Unique ID"
          value={uniqueId}
          onChange={e => setUniqueId(e.target.value)}
        />
        <button onClick={fetchData}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      {matchLinks.length > 0 && (
        <>
          <table border="1" cellPadding="8" style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Match Link</th>
                <th>Mobile 1</th>
                <th>Mobile 2</th>
                <th>Person Name</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {matchLinks.map((link, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{link}</td>
                  <td>
                    <input
                      type="text"
                      value={mobileNumbers[index] || ''}
                      onChange={e => handleChange(setMobileNumbers, index, e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={mobileNumbers2[index] || ''}
                      onChange={e => handleChange(setMobileNumbers2, index, e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={personNames[index] || ''}
                      onChange={e => handleChange(setPersonNames, index, e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={personLocations[index] || ''}
                      onChange={e => handleChange(setPersonLocations, index, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleSubmit} style={{ marginTop: '20px' }}>
            Save All
          </button>
        </>
      )}
    </div>
  );
};

export default UpdateLinkDetails;
