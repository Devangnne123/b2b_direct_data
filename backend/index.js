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
app.use('/', tempLinkMobileRoutes);

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
  
      const uniqueId = uuidv4();
      let matchCount = 0;
  
      for (const link of links) {
        const cleanedLink = link.replace(/linkedin\.com\/+in\//i, 'linkedin.com/in/').toLowerCase();
        const remark = cleanedLink.includes('linkedin.com/in/') ? 'ok' : 'invalid';
  
        let matchLink = null;
        const matched = await MasterUrl.findOne({ where: { clean_linkedin_link: cleanedLink } });
        if (matched) {
          matchLink = cleanedLink;
          matchCount++;
        }
  
        await Link.create({
          uniqueId,
          email,
          link,
          totallink:links.length,
          clean_link: cleanedLink,
          remark,
          fileName: req.file.originalname,
          matchLink,
          matchCount:  matchCount,
          
        });
  
        // Save matched link in TempLinkMobile
        if (matchLink) {
          await TempLinkMobile.create({
            uniqueId,
            matchLink,
          });
        }
      }
  
      fs.unlinkSync(filePath);
  
      res.json({
        message: 'Upload successful',
        uniqueId,
        fileName: req.file.originalname,
        
        matchCount,
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  // ////for tempmobilelink
  
  
  // // POST /save-temp-link-mobile
  
  // // GET handler: Fetch data for a given uniqueId
  // router.post('/get-templink', async (req, res) => {
  //   const { uniqueId } = req.body;
  
  //   try {
  //     const existing = await TempMobileLink.findOne({ where: { uniqueId } });
  
  //     if (!existing) {
  //       return res.status(404).json({ message: 'Record not found' });
  //     }
  
  //     res.json(existing);
  //   } catch (err) {
  //     console.error('Error fetching temp link:', err);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // });
  
  // // POST handler: Insert or update data
  // router.post('/update-templink', async (req, res) => {
  //   const {
  //     uniqueId,
  //     matchLinks,
  //     mobile_numbers,
  //     mobile_numbers_2,
  //     person_names,
  //     person_locations,
  //   } = req.body;
  
  //   try {
  //     const [existing, created] = await TempMobileLink.findOrCreate({
  //       where: { uniqueId },
  //       defaults: {
  //         matchLinks,
  //         mobile_numbers,
  //         mobile_numbers_2,
  //         person_names,
  //         person_locations,
  //       },
  //     });
  
  //     if (!created) {
  //       await existing.update({
  //         matchLinks,
  //         mobile_numbers,
  //         mobile_numbers_2,
  //         person_names,
  //         person_locations,
  //       });
  //     }
  
  //     res.json({ message: 'Data saved successfully' });
  //   } catch (err) {
  //     console.error('Error updating temp link:', err);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // });
  
  
  
  
  
  
  // app.get('/get-details-by-matchlink', async (req, res) => {
  //   const { matchLink } = req.query;
  
  //   if (!matchLink) {
  //     return res.status(400).json({ error: 'matchLink is required' });
  //   }
  
  //   try {
  //     const linkEntry = await Link.findOne({
  //       where: {
  //         matchLinks: {
  //           [Sequelize.Op.contains]: [matchLink],
  //         },
  //       },
  //     });
  
  //     if (!linkEntry || !Array.isArray(linkEntry.matchLinks)) {
  //       return res.status(404).json({ error: 'No data found for this matchLink' });
  //     }
  
  //     const index = linkEntry.matchLinks.findIndex(link => link === matchLink);
  
  //     if (index === -1) {
  //       return res.status(404).json({ error: 'matchLink not found in matchLinks array' });
  //     }
  
  //     return res.json({
  //       matchLink,
  //       mobile_number: linkEntry.mobile_numbers?.[index] || null,
  //       mobile_number_2: linkEntry.mobile_numbers_2?.[index] || null,
  //       person_name: linkEntry.person_names?.[index] || null,
  //       person_location: linkEntry.person_locations?.[index] || null,
  //     });
  //   } catch (error) {
  //     console.error('Error fetching details by matchLink:', error);
  //     return res.status(500).json({ error: 'Internal server error' });
  //   }
  // });
  
const linkRoutes = require('./routes/singleLookup');
app.use('/api/links', linkRoutes);
  
  
  
  
  
  
  
  
  
  
  
  
  const cron = require('node-cron');
  
  cron.schedule('*/30 * * * * *', async () => {
    try {
      console.log('⏳ Syncing TempLinkMobile to Link based on matchLink (excluding nulls)...');
  
      const tempRecords = await TempLinkMobile.findAll();
  
      for (const temp of tempRecords) {
        const {
          matchLink,
          mobile_number,
          mobile_number_2,
          person_name,
          person_location
        } = temp;
  
        // ✅ Skip if any field is null
        if (
          !matchLink ||
          mobile_number === null ||
          mobile_number_2 === null ||
          person_name === null ||
          person_location === null
        ) {
          console.log(`⏭️ Skipping matchLink ${matchLink} due to null values.`);
          continue;
        }
  
        const [updatedCount] = await Link.update(
          {
            mobile_number,
            mobile_number_2,
            person_name,
            person_location
          },
          {
            where: { matchLink }
          }
        );
  
        if (updatedCount > 0) {
          console.log(`✅ Updated ${updatedCount} Link record(s) for matchLink: ${matchLink}`);
        }
      }
  
      console.log('✅ Sync complete.');
    } catch (err) {
      console.error('❌ Error during sync:', err);
    }
  });
  




  app.use('/api', require('./routes/file'));

app.use('/api', require('./routes/user'));


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