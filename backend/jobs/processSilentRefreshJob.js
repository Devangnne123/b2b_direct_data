const axios = require('axios');
const Link = require("../model/Link");
const User = require("../model/userModel"); // Adjust path as needed
async function processSilentRefreshJob(job) {
  const { email, token } = job.data;

  try {
    if (!email || email === 'Guest') {
      return { success: false, message: 'Invalid or missing email' };
    }

    // Fetch links and credits concurrently
    const [linksRes, creditsRes] = await Promise.all([
      axios.get(`${process.env.VITE_API_BASE_URL}/bulklookup/get-links`, {
        headers: {
          'user-email': email,
          Authorization: `Bearer ${token}`,
        },
      }),
      axios.get(`${process.env.VITE_API_BASE_URL}/api/user/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const now = Date.now();
    const newData = linksRes.data || [];

    // Preserve processing status for items within 1 minute window
    const updatedData = newData.map((item) => {
      const itemTime = new Date(item.date || 0).getTime();
      if (now - itemTime < 60000) {
        return { ...item, status: 'pending' };
      }
      return item;
    });

    // Store results in Redis or database if needed (optional, depending on requirements)
    // For now, return the processed data
    return {
      success: true,
      message: 'Silent refresh completed',
      uploadedData: updatedData,
      credits: creditsRes.data.credits,
    };
  } catch (error) {
    console.error('Silent refresh job error:', error);
    throw error;
  }
}

module.exports = { processSilentRefreshJob };