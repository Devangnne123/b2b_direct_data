const express = require('express')
const app = express()
const multer = require('multer');
const xlsx= require('xlsx');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./config/db');
const Link = require('./model/Link');
const path = require('path');
const fs = require('fs');
const MasterUrl = require('./model/MasterUrl'); // MasterUrl model
const TempLinkMobile = require('./model/TempLinkMobile');///tempmobile


const cors = require('cors');
require('dotenv').config();  // Load the .env file


  
  app.use(cors());

app.use(express.json()); // middleware
app.use(express.urlencoded({ extended: false })); // middleware
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const tempLinkMobileRoutes = require('./routes/tempLinkRoutes');
app.use('/api', tempLinkMobileRoutes);

// Middleware





  // upload file 
const upload = multer({ dest: 'uploads/' });

app.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const links = rows.flat().filter(cell =>
      typeof cell === 'string' && cell.includes('linkedin.com/in')
    );
    if (links.length === 0) {
      return res.status(400).json({ message: 'No valid LinkedIn links found.' });
    }

    // Clean links
    const cleanedLinks = links.map(link => {
      let cleanedLink = link.replace('Linkedin.Com/In/', 'linkedin.com/in/').replace('linkedin.com//in/', 'linkedin.com/in/').toLowerCase();
      return cleanedLink;
    });

    // Remarks
    const remarks = links.map(link => {
      if (link.includes('linkedin.com/in/')) {
        return 'ok';
      }
      return 'invalid';
    });

    // Match links with MasterUrl table
    const matchLinks = [];
    for (const cleanLink of cleanedLinks) {
      const masterLink = await MasterUrl.findOne({ where: { clean_linkedin_link: cleanLink } });
      if (masterLink) {
        matchLinks.push(cleanLink); // Add matched link
      }
    }


    

    const uniqueId = uuidv4();

    const saved = await Link.create({
      uniqueId,
      totalLinks: links.length,
      links,
      email,
      clean_links: cleanedLinks,   // Cleaned links
      remark: remarks.join(', '),  // Remarks
      fileName: req.file.originalname,
      matchLinks: matchLinks, // Store file name here
      matchCount: matchLinks.length, 
      // mobile_numbers,
      // person_names,
      // person_locations,
      // mobile_numbers_2,// Add match count
    });

    // Store matched links in TempLinkMobile table
    if (matchLinks.length > 0) {
      await TempLinkMobile.create({
        uniqueId, // Link's unique ID
        matchLinks, // Store matched links
      });
    }

    // Optionally delete the file from disk
    fs.unlinkSync(filePath);

    res.json({
      message: 'Upload successful',
      uniqueId,
      fileName: saved.fileName,
      totalLinks: saved.totalLinks,
      matchCount: matchLinks.length,  // Send match count in the response
      clean_links: cleanedLinks,   // Cleaned links
      remark: remarks.join(', '),  // Remarks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});







// backend/server.js
app.get('/get-links', async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: 'Email required in headers' });

    const userLinks = await Link.findAll({
      where: { email },
      order: [['date', 'DESC']], // most recent first
    });

    res.json(userLinks);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});









sequelize.sync({ alter: true }).then(() => {
  app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
});  

const mobileEnrichmentRoutes = require('./routes/mobileEnrichmentRoutes')
app.use('/mobileEnrichments', mobileEnrichmentRoutes)

const userRoutes = require('./routes/userRoutes')
app.use('/users', userRoutes)

const bulkUploadRoutes = require('./routes/bulkUploadRoutes')
app.use('/bulkUpload', bulkUploadRoutes)

const creditTransactionRoutes = require("./routes/creditTransactionRoutes");  // Import new routes
app.use("/transactions", creditTransactionRoutes);  

const excelRoutes = require('./routes/excelRoutes')
app.use('/excel', excelRoutes);

const superAdminRoutes = require('./routes/superAdminRoutes')
app.use('/super-admin', superAdminRoutes);

const uploadedLinksRoutes = require("./routes/uploadedLinksRoutes");
app.use("/uploadedLinks", uploadedLinksRoutes);