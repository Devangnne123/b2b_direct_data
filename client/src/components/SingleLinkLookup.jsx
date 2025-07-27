import React, { useState } from 'react';
import axios from 'axios';

const SearchMatchLink = () => {
  const [matchLink, setMatchLink] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!matchLink) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/links/search-match?matchLink=${matchLink}`);
      setResult(res.data.result);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Search by MatchLink</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={matchLink}
          onChange={(e) => setMatchLink(e.target.value)}
          placeholder="Enter matchLink"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-500">Searching...</p>}

      {notFound && <p className="text-red-600">No result found.</p>}

      {result && (
        <div className="border p-4 rounded shadow bg-white">
          <p><strong>Match Link:</strong> {result.matchLink}</p>
          <p><strong>Mobile Number:</strong> {result.mobile_number || '—'}</p>
          <p><strong>Mobile Number 2:</strong> {result.mobile_number_2 || '—'}</p>
          <p><strong>Person Name:</strong> {result.person_name || '—'}</p>
          <p><strong>Location:</strong> {result.person_location || '—'}</p>
        </div>
      )}
    </div>
  );
};

export default SearchMatchLink;
