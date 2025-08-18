const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
const multer = require('multer');
const xlsx= require('xlsx');
const { Sequelize,Op } = require('sequelize');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { sequelize,LinkedInProfile } = require('./config/db');
const Link = require('./model/Link');
 const axios = require('axios');
const fs = require('fs');
const MasterUrl = require('./model/MasterUrl'); // MasterUrl model
const TempLinkMobile = require('./model/TempLinkMobile');///tempmobile
const User  = require('./model/userModel'); // Adjust path as needed
const emailsent =require('./model/emailsent');
const emailsent1 =require('./model/emailsent_v');
const emailsent2 =require('./model/emailsent_c');
const path=require("path");




const cors = require('cors');
require('dotenv').config();  // Load the .env file

const PORT =  8080;
app.use(bodyParser.json());
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = ['/api/', 'http://3.109.203.132:3005/'];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST'],
//   credentials: true
// }));


app.use(express.json()); // middleware
const _dirname=path.dirname("")
const buildpath = path.join(_dirname,"../client/dist")
app.use(express.static(buildpath));
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: false })); // middleware

const apiKeyAuth = require("./middleware/apiKeyAuth");
const auth = require("./middleware/authMiddleware")





////bulklookup/////////////////////////////////////////////////////////////////////////
    
const upload = multer({ dest: 'uploads/' });


app.post('/upload-excel', auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

    // Get credit information from headers
    const creditCost = parseFloat(req.headers['credit-cost']);
    const userCredits = parseFloat(req.headers['user-credits']);

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract and filter LinkedIn links
    const links = rows.flat().filter(cell => 
      typeof cell === 'string' && 
      cell.toLowerCase().includes('linkedin.com')
    );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'No LinkedIn links found.' });
    }

     // Check if user has enough credits
    const requiredCredits = creditCost * links.length;
    if (userCredits < requiredCredits) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: `Insufficient credits. You need ${requiredCredits} but only have ${userCredits}` 
      });
    }

    // For any number of links (less than or equal to 1000), require confirmation
    if (links.length <= 5000) {
      return res.status(200).json({ 
        message: "Confirmation required to proceed", 
        linkCount: links.length,
        requiresConfirmation: true,
        fileName: req.file.originalname
      });
    }

  

    // If more than 1000 links, reject immediately
    if (links.length > 5000) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Max 5000 links allowed" });
    }
      

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// app.post('/confirm-upload-excel', auth , upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

//     const filePath = req.file.path;
//     const workbook = xlsx.readFile(filePath);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//     // Extract and filter LinkedIn links with more comprehensive matching
//     const links = rows.flat().filter(cell => 
//       typeof cell === 'string' && 
//       cell.toLowerCase().includes('linkedin.com')
//     );

//     if (links.length === 0) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: 'No LinkedIn links found.' });
//     }
//     // Example of potential backend limit
// if (links.length >= 5000) {
//   return res.status(400).json({ message: "Max 5000 links allowed" });
// }


//     const uniqueId = uuidv4();
//     let matchCount = 0;

//     for (const link of links) {
//       // First determine the link type/remark
//       let remark;
//       if (/linkedin\.com\/in\/ACw|acw|ACo|sales\/lead\/ACw|sales\/people\/ACw|sales\/people\/acw|sales\/people\/AC/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } else if (/linkedin\.com\/company/i.test(link)) {
//         remark = 'Company Link';
//       } else if (/linkedin\.com\/pub\//i.test(link)) {
//         remark = 'Old_link_check';
//       } else if (!/linkedin\.com\/in\//i.test(link) && !/Linkedin\.Com\/In\//i.test(link) && !/linkedin\.com\/\/in\//i.test(link)) {
//         remark = 'Junk Link';
//       } else {
//         remark = 'ok';
//       }

//       // Clean the link only if it's marked as 'ok'
//       let cleanedLink = link;
//       if (remark === 'ok') {
//         cleanedLink = link
//           .replace(/^(https?:\/\/)?(www\.)?/i, '') // Strips http/https/www // Remove http://, https://, and www.
//           .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
//           .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
//           .toLowerCase();
//       }

//       let matchLink = null;
//       let linkedinLinkId = null;

//       // Only try to match if it's a clean profile link
//       if (remark === 'ok') {
//         const matched = await MasterUrl.findOne({
//           where: { clean_linkedin_link: cleanedLink },
//           attributes: ['linkedin_link_id', 'clean_linkedin_link'],
//         });

//         if (matched) {
//           matchLink = cleanedLink;
//           linkedinLinkId = matched.linkedin_link_id;
//           matchCount++;
         
//         }
//       }

//       await Link.create({
//         uniqueId,
//         email,
//         link,
//         totallink: links.length,
//         clean_link: cleanedLink,
//         remark,
//         fileName: req.file.originalname,
//         matchLink,
//         linkedin_link_id: linkedinLinkId,
//         matchCount,
//       });
//     }

//     fs.unlinkSync(filePath);

//     res.json({
//       message: 'Upload successful',
//       uniqueId,
//       fileName: req.file.originalname,
//       totallink: links.length,
//       matchCount,
//     });

//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     res.status(500).json({ error: 'Upload failed', details: err.message });
//   }

  
// });

// app.post('/confirm-upload',auth, async (req, res) => {
//   try {
//     const { uniqueId, email } = req.body;
    
//     // Find all matched links for this upload
//     const matchedLinks = await Link.findAll({
//       where: { 
//         uniqueId,
//         email,
//         matchLink: { [Op.ne]: null } // Only links that have matches
//       }
//     });

//     // Create TempLinkMobile records for each match
//     for (const link of matchedLinks) {
//       await TempLinkMobile.create({
//         uniqueId: link.uniqueId,
//         matchLink: link.matchLink,a
//         linkedin_link_id: link.linkedin_link_id
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Temp records created successfully',
//       count: matchedLinks.length
//     });

//   } catch (err) {
//     console.error('Confirmation error:', err);
//     res.status(500).json({ error: 'Confirmation failed', details: err.message });
//   }
// });




// New consolidated route in your backend
// app.post('/api/process-upload', auth, async (req, res) => {
//   try {
//     const { 
//       userEmail, 
//       creditCost, 
//       uniqueId, 
//       fileName, 
//       totalLinks, 
//       matchCount 
//     } = req.body;

//     // 1. Deduct credits
//     const user = await User.findOne({ where: { userEmail } });
//     if (!user) {
//       await Link.destroy({ where: { uniqueId } }); // Cleanup
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (user.credits < creditCost) {
//        await Link.destroy({ where: { uniqueId } }); // Cleanup
//       return res.status(400).json({ message: 'Insufficient credits' });

//     }

//     user.credits -= creditCost;
//     await user.save();

//     // 2. Update Link entries
//     await Link.update(
//       {
//         creditDeducted: creditCost,
//         remainingCredits: user.credits,
//       },
//       { where: { uniqueId } }
//     );

//     // 3. Create TempLinkMobile records
//     const matchedLinks = await Link.findAll({
//       where: { 
//         uniqueId,
//         email: userEmail,
//         matchLink: { [Op.ne]: null }
//       }
//     });

//     for (const link of matchedLinks) {
//       await TempLinkMobile.create({
//         uniqueId: link.uniqueId,
//         matchLink: link.matchLink,
//         linkedin_link_id: link.linkedin_link_id
//       });
//     }

//     // 4. Send notification (fire and forget)
//     try {
//       const mailOptions = {
//         from: "b2bdirectdata@gmail.com",
//         to: userEmail,
//         subject: 'Your Bulk LinkedIn Lookup Upload Status',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Upload Processed</h2>
//             <p>Your file has been successfully processed by our system.</p>
            
//             <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
//               <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
//               <p><strong>File Name:</strong> ${fileName}</p>
//               <p><strong>Total Links Processed:</strong> ${totalLinks}</p>
//               <p><strong>Matches Found:</strong> ${matchCount}</p>
//               <p><strong>Credits Deducted:</strong> ${creditCost}</p>
//             </div>
            
//             <p>You can download your results from the Bulk Lookup section of your dashboard.</p>
//             <p>If you have any questions, please reply to this email.</p>
            
//             <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
//               This is an automated message. Please do not reply directly to this email.
//             </p>
//           </div>
//         `
//       };
//       transporter.sendMail(mailOptions).catch(console.error);
//     } catch (emailError) {
//       console.error('Email failed:', emailError);
//       // Don't fail the whole request if email fails
//     }

//     res.json({
//       success: true,
//       message: 'Upload processed successfully',
//       updatedCredits: user.credits,
//       tempRecordsCreated: matchedLinks.length
//     });

//   } catch (error) {
//     console.error('Process upload error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Upload processing failed',
//       error: error.message 
//     });
//   }
// });



// app.post('/process-linkedin-upload', auth, upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'] || req.body.userEmail;
//     if (!email) return res.status(400).json({ error: "Email required" });

//      // Set processing status to true at the start
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );

//      // Create a timeout for 5 minutes
//     const processingTimeout = setTimeout(async () => {
//       try {
//         const user = await User.findOne({ where: { userEmail: email } });
//         if (user && user.isProcessingFile) {
//           await user.update({ isProcessingFile: false, processingStartTime: null });
//           return res.status(400).json({ error: "Upload timed out" });
         
//         }
//       } catch (timeoutError) {
//         console.error('Error during processing timeout:', timeoutError);
//       }
//     }, 1 * 60 * 1000); // 5 minutes


//     // Initialize variables
//     let uniqueId, matchCount = 0, links = [];
//     const processCredits = req.body.processCredits === 'true';

//     // Process file if present
//     if (req.file) {
//       const filePath = req.file.path;
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//       // Extract and filter LinkedIn links
//       links = rows.flat().filter(cell => 
//         typeof cell === 'string' && 
//         cell.toLowerCase().includes('linkedin.com')
//       );

//       if (links.length === 0) {
//         fs.unlinkSync(filePath);
//         clearTimeout(processingTimeout);
//         await axios.post(
//           `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//           { userEmail: email, isProcessing: false }
//         );
//         return res.status(400).json({ message: 'No LinkedIn links found.' });
//       }

//       if (links.length >= 5000) {
//         fs.unlinkSync(filePath);

//         clearTimeout(processingTimeout);
//         await axios.post(
//           `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//           { userEmail: email, isProcessing: false }
//         );
         
//         return res.status(400).json({ message: "Max 5000 links allowed" });
//       }

//       uniqueId = uuidv4();

//       // Process all links
//       for (const link of links) {
        
//         let remark;
//         if (/linkedin\.com\/in\/ACw|acw|ACo|sales\/lead\/ACw|sales\/people\/ACw|sales\/people\/acw|sales\/people\/AC/i.test(link)) {
//           remark = 'Sales Navigator Link';
//         } else if (/linkedin\.com\/company/i.test(link)) {
//           remark = 'Company Link';
//         } else if (/linkedin\.com\/pub\//i.test(link)) {
//           remark = 'Old_link_check';
//         } else if (!/linkedin\.com\/in\//i.test(link) && !/Linkedin\.Com\/In\//i.test(link) && !/linkedin\.com\/\/in\//i.test(link)) {
//           remark = 'Junk Link';
//         } else {
//           remark = 'ok';
//         }

//         let cleanedLink = link;
//         if (remark === 'ok') {
//           cleanedLink = link
//             .replace(/^(https?:\/\/)?(www\.)?/i, '')
//             .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
//             .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
//             .toLowerCase();
//         }

//         let matchLink = null;
//         let linkedinLinkId = null;

//         if (remark === 'ok') {
//           const matched = await MasterUrl.findOne({
//             where: { clean_linkedin_link: cleanedLink },
//             attributes: ['linkedin_link_id', 'clean_linkedin_link'],
//           });

//           if (matched) {
//             matchLink = cleanedLink;
//             linkedinLinkId = matched.linkedin_link_id;
//             matchCount++;
//           }
//         }

//         await Link.create({
//           uniqueId,
//           email,
//           link,
//           totallink: links.length,
//           clean_link: cleanedLink,
//           remark,
//           fileName: req.file.originalname,
//           matchLink,
//           linkedin_link_id: linkedinLinkId,
//           matchCount,
//         });
//       }

//       fs.unlinkSync(filePath);
//     }

//     // Process credits if requested
//     if (processCredits && uniqueId) {
//       const user = await User.findOne({ where: { userEmail: email } });
//       if (!user) {
//         await Link.destroy({ where: { uniqueId } });
//          clearTimeout(processingTimeout);
        
//         await axios.post(
//           `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//           { userEmail: email, isProcessing: false }
//         );
//         return res.status(404).json({ message: 'User not found' });
//       }


//       const creditCost = matchCount * user.creditCostPerLink; // Assuming 1 credit per match
//       if (user.credits < creditCost) {
//         await Link.destroy({ where: { uniqueId } });
//        clearTimeout(processingTimeout);
//         await axios.post(
//           `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//           { userEmail: email, isProcessing: false }
//         );
//         return res.status(400).json({ message: 'Insufficient credits' });
//       }

//       user.credits -= creditCost;
//       await user.save();

//       // Update Link entries with credit info
//       await Link.update(
//         {
//           creditDeducted: creditCost,
//           remainingCredits: user.credits,
//         },
//         { where: { uniqueId } }
//       );

//       // Create TempLinkMobile records
//       const matchedLinks = await Link.findAll({
//         where: { 
//           uniqueId,
//           email: email,
//           matchLink: { [Op.ne]: null }
//         }
//       });

//       for (const link of matchedLinks) {
//         await TempLinkMobile.create({
//           uniqueId: link.uniqueId,
//           matchLink: link.matchLink,
//           linkedin_link_id: link.linkedin_link_id
//         });
//       }
//         clearTimeout(processingTimeout);
//         await axios.post(
//               `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//               {
//                 userEmail: email,
//                 isProcessing: false
//               }
//               // },{      headers: { Authorization: `Bearer ${token}` }  }    
//             );

//       // Send notification email
//       try {
//         const mailOptions = {
//           from: "b2bdirectdata@gmail.com",
//           to: email,
//           subject: 'Your Bulk LinkedIn Lookup Upload Status',
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//               <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Upload Processed</h2>
//               <p>Your file has been successfully processed by our system.</p>
              
//               <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
//                 <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
//                 <p><strong>File Name:</strong> ${req.file?.originalname || 'Unknown'}</p>
//                 <p><strong>Total Links Processed:</strong> ${links.length}</p>
//                 <p><strong>Matches Found:</strong> ${matchCount}</p>
//                 <p><strong>Credits Deducted:</strong> ${creditCost}</p>
//               </div>
              
//               <p>You can download your results from the Bulk Lookup section of your dashboard.</p>
              
//               <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
//                 This is an automated message. Please do not reply directly to this email.
//               </p>
//             </div>
//           `
//         };
//         transporter.sendMail(mailOptions).catch(console.error);
//       } catch (emailError) {
//         console.error('Email failed:', emailError);
//       }

//       return res.json({
//         success: true,
//         message: 'Upload processed successfully',
//         uniqueId,
//         fileName: req.file?.originalname,
//         totallink: links.length,
//         matchCount,
//         updatedCredits: user.credits,
//         tempRecordsCreated: matchedLinks.length
//       });
//     }

//     // Return response for file processing without credit deduction
//     return res.json({
//       message: 'Upload successful',
//       uniqueId,
//       fileName: req.file?.originalname,
//       totallink: links.length,
//       matchCount,
//       nextStep: processCredits ? undefined : 'process-credits'
//     });

//   } catch (err) {
//     console.error('Upload/process error:', err);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
    
//     if (req.body?.uniqueId) {
//       try {
//         await Link.destroy({ where: { uniqueId: req.body.uniqueId } });
//       } catch (cleanupError) {
//         console.error('Cleanup failed:', cleanupError);
//       }
//     }
    
//     res.status(500).json({ 
//       error: 'Upload/processing failed', 
//       details: err.message 
//     });
//   }

// });



app.post('/process-linkedin-upload', auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'] || req.body.userEmail;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Set processing status to true at the start
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
      { userEmail: email, isProcessing: true }
    );

    // Initialize variables
    let uniqueId, links = [];
    const processCredits = req.body.processCredits === 'true';
    const BATCH_SIZE = 300; // Process 20 links at a time when checking database

    // Process file if present
    if (req.file) {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      // Extract and filter LinkedIn links
      links = rows.flat().filter(cell => 
        typeof cell === 'string' && 
        cell.toLowerCase().includes('linkedin.com')
      );

      if (links.length === 0) {
        fs.unlinkSync(filePath);
        await setProcessingFalse(email);
        return res.status(400).json({ message: 'No LinkedIn links found.' });
      }

      if (links.length >= 5000) {
        fs.unlinkSync(filePath);
        await setProcessingFalse(email);
        return res.status(400).json({ message: "Max 5000 links allowed" });
      }

      uniqueId = uuidv4();
      let matchCount = 0;

      // First pass: Process all links to categorize them
      for (const link of links) {
        let remark;
        if (/linkedin\.com\/in\/ACw|acw|ACo|sales\/lead\/ACw|sales\/people\/ACw|sales\/people\/acw|sales\/people\/AC/i.test(link)) {
          remark = 'Sales Navigator Link';
        } else if (/linkedin\.com\/company/i.test(link)) {
          remark = 'Company Link';
        } else if (/linkedin\.com\/pub\//i.test(link)) {
          remark = 'Old_link_check';
        } else if (!/linkedin\.com\/in\//i.test(link) && !/Linkedin\.Com\/In\//i.test(link) && !/linkedin\.com\/\/in\//i.test(link)) {
          remark = 'Junk Link';
        } else {
          remark = 'ok';
        }

        let cleanedLink
        if (remark === 'ok') {
          cleanedLink = link
            .replace(/^(https?:\/\/)?(www\.)?/i, '')
            .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
            .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
            .toLowerCase();
        }

        // Create record without matching yet
        await Link.create({
          uniqueId,
          email,
          link,
          totallink: links.length,
          clean_link: cleanedLink,
          remark,
          
          fileName: req.file.originalname,
          
        });
        
      }

      await emailsent.create({
          uniqueId,
          email
     });

      // Second pass: Process potential matches in batches of 20
let offset = 0;
while (true) {
  // Get batch of 20 pending links
  const batch = await Link.findAll({
    where: { 
      uniqueId,
      email,
    },
    limit: BATCH_SIZE,
    offset: offset,
    order: [['id', 'ASC']]
  });

  if (batch.length === 0) break;

  // Filter out null/undefined clean_link values
  const cleanLinks = batch.map(item => item.clean_link).filter(link => link);

  // Only proceed with MasterUrl lookup if we have valid cleanLinks
  if (cleanLinks.length > 0) {
    const matchedRecords = await MasterUrl.findAll({
      where: { 
        clean_linkedin_link: { [Op.in]: cleanLinks }
      },
      attributes: ['linkedin_link_id', 'clean_linkedin_link'],
    });

    // Create a map for quick lookup
    const matchMap = new Map();
    matchedRecords.forEach(record => {
      matchMap.set(record.clean_linkedin_link, record.linkedin_link_id);
    });

    // Update only links with non-null clean_link values
    for (const link of batch) {
      if (link.clean_link) {  // Only process if clean_link exists
        const linkedinLinkId = matchMap.get(link.clean_link);
        if (linkedinLinkId) {
          await Link.update({
            matchLink: link.clean_link,
            linkedin_link_id: linkedinLinkId,
            matchCount: ++matchCount
          }, { where: { id: link.id } });
        } 
    }
  } 
  }
  offset += BATCH_SIZE;
}

// File cleanup

  fs.unlinkSync(filePath);

    }

    // Process credits if requested (only after all processing is complete)
    if (processCredits && uniqueId) {
      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        await Link.destroy({ where: { uniqueId } });
        await setProcessingFalse(email);
        return res.status(404).json({ message: 'User not found' });
      }


      // Get count of actually matched links (where linkedin_link_id exists)
const matchedCount = await Link.count({
  where: { 
    uniqueId,
    email: email,
    linkedin_link_id: { [Op.ne]: null } // Only count successfully matched links
  }
});

      await Link.update(
        {
          matchedCount: matchedCount,
        
        },
        { where: { uniqueId } }
      );

     

      const creditCost = matchedCount * user.creditCostPerLink;
      if (user.credits < creditCost) {
        await Link.destroy({ where: { uniqueId } });
        await setProcessingFalse(email);
        return res.status(400).json({ message: 'Insufficient credits' });
      }

      user.credits -= creditCost;
      await user.save();

      // Update Link entries with credit info
      await Link.update(
        {
          creditDeducted: creditCost,
          remainingCredits: user.credits,
        },
        { where: { uniqueId } }
      );

      // Create TempLinkMobile records for ALL matched links
      const matchedLinks = await Link.findAll({
        where: { 
          uniqueId,
          email: email,
          linkedin_link_id: { [Op.ne]: null }
          
        }
      });

      for (const link of matchedLinks) {
        await TempLinkMobile.create({
          uniqueId: link.uniqueId,
          matchLink: link.matchLink,
          linkedin_link_id: link.linkedin_link_id,
          processed: true
        });
      }

      await setProcessingFalse(email);
      
      // Send notification email
      try {
        const mailOptions = {
          from: "b2bdirectdata@gmail.com",
          to: email,
          subject: 'Bulk LinkedIn Lookup - Processing',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Processing</h2>
              
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
                <p><strong>File Name:</strong> ${req.file?.originalname || 'Unknown'}</p>
                <p><strong>Total Links Processed:</strong> ${links.length}</p>
                <p><strong>Total Matches Found:</strong> ${matchedCount}</p>
                <p><strong>Credits Deducted:</strong> ${creditCost}</p>
              </div>
              
              
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
          `
        };
        transporter.sendMail(mailOptions).catch(console.error);
      } catch (emailError) {
        console.error('Email failed:', emailError);
      }

      return res.json({
        success: true,
        message: 'Processing completed successfully',
        uniqueId,
        fileName: req.file?.originalname,
        totallink: links.length,
        matchedCount:matchedCount,
        updatedCredits: user.credits,
        tempRecordsCreated: matchedLinks.length
      });
    }
    
    // Return response for file processing without credit deduction
    await setProcessingFalse(email);
    return res.json({
      message: 'Upload successful',
      uniqueId,
      fileName: req.file?.originalname,
      totallink: links.length,
      nextStep: processCredits ? undefined : 'process-credits'
    });

  } catch (err) {
    console.error('Upload/process error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    
    if (req.body?.uniqueId) {
      try {
        await Link.destroy({ where: { uniqueId: req.body.uniqueId } });
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }
    
    try {
      const email = req.headers['user-email'] || req.body.userEmail;
      if (email) await setProcessingFalse(email);
    } catch (error) {
      console.error('Error clearing processing status:', error);
    }
    
    res.status(500).json({ 
      error: 'Upload/processing failed', 
      details: err.message 
    });
  }
});

// Helper function to set processing status to false
async function setProcessingFalse(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
      { userEmail: email, isProcessing: false }
    );
  } catch (error) {
    console.error('Error setting processing to false:', error);
  }
}


// const rateLimit = require('express-rate-limit');


// // Rate limiter configuration
// const uploadLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each user to 5 uploads per windowMs
//   keyGenerator: (req) => req.headers['user-email'] || req.body.userEmail,
//   message: 'Too many upload attempts, please try again later'
// });

// app.post('/process-linkedin-upload', auth, uploadLimiter, upload.single('file'), async (req, res) => {
  
//   let responseSent = false;
//   let cleanupRequired = true;
//   let uniqueId;
//   let email;

//   // Cleanup function
//   const cleanup = async () => {
//     if (!cleanupRequired) return;
    
//     try {
//       if (req.file?.path) safeUnlink(req.file.path);
//       if (uniqueId) {
//         const transaction = await sequelize.transaction();
//         try {
//           await Link.destroy({ where: { uniqueId }, transaction });
//           await TempLinkMobile.destroy({ where: { uniqueId }, transaction });
//           await transaction.commit();
//         } catch (transactionError) {
//           await transaction.rollback();
//           throw transactionError;
//         }
//       }
//       if (email) await setProcessingFalse(email);
//       cleanupRequired = false;
//     } catch (cleanupError) {
//       console.error('Cleanup failed:', cleanupError);
//     }
//   };

//   try {
//     email = req.headers['user-email'] || req.body.userEmail;
//     if (!email) {
//       responseSent = true;
//       return res.status(400).json({ error: "Email required" });
//     }

//     // // Check daily upload limit
//     // const recentUploads = await Link.count({
//     //   where: { 
//     //     email,
//     //     createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
//     //   }
//     // });

//     // if (recentUploads >= 10) {
//     //   await cleanup();
//     //   responseSent = true;
//     //   return res.status(429).json({ 
//     //     error: 'Daily limit exceeded',
//     //     message: 'You have reached your maximum uploads for today'
//     //   });
//     // }

//     // Set processing status
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );

//     // // 5-minute timeout handler
//     // processingTimeout = setTimeout(async () => {
//     //   if (!responseSent) {
//     //     try {
//     //       const user = await User.findOne({ where: { userEmail: email } });
//     //       if (user && user.isProcessingFile==) {
//     //         await cleanup();
//     //         if (!responseSent) {
//     //           responseSent = true;
//     //           res.status(408).json({ 
//     //             error: "Processing timed out",
//     //             message: "The operation took too long and was cancelled. All temporary data has been cleaned up."
//     //           });
//     //         }
//     //       }
//     //     } catch (timeoutError) {
//     //       console.error('Error during processing timeout:', timeoutError);
//     //       if (!responseSent) {
//     //         responseSent = true;
//     //         res.status(500).json({ 
//     //           error: "Timeout handler failed",
//     //           message: "An error occurred while handling the processing timeout."
//     //         });
//     //       }
//     //     }
//     //   }
//     // }, 5 * 60 * 1000);

//     // Initialize variables
//     let matchCount = 0, links = [];
//     const processCredits = req.body.processCredits === 'true';

//     // Process file if present
//     if (req.file) {
//       const filePath = req.file.path;
      
//       try {
//         const workbook = xlsx.readFile(filePath);
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//         // Extract and filter LinkedIn links
//         links = rows.flat().filter(cell => 
//           typeof cell === 'string' && 
//           cell.toLowerCase().includes('linkedin.com')
//         );

//         if (links.length === 0) {
//           await cleanup();
//           responseSent = true;
//           return res.status(400).json({ message: 'No LinkedIn links found.' });
//         }

//         if (links.length >= 5000) {
//           await cleanup();
//           responseSent = true;
//           return res.status(400).json({ message: "Max 5000 links allowed" });
//         }

//         uniqueId = uuidv4();

//         // Process links in batches of 20
//         const batchSize = 2;
//         const linkBatches = [];
//         for (let i = 0; i < links.length; i += batchSize) {
//           linkBatches.push(links.slice(i, i + batchSize));
//         }

//         for (const batch of linkBatches) {
//           const transaction = await sequelize.transaction();
//           try {
//             const batchInserts = await Promise.all(batch.map(async (link) => {
//               let remark;
//               if (/linkedin\.com\/in\/ACw|acw|ACo|sales\/lead\/ACw|sales\/people\/ACw|sales\/people\/acw|sales\/people\/AC/i.test(link)) {
//                 remark = 'Sales Navigator Link';
//               } else if (/linkedin\.com\/company/i.test(link)) {
//                 remark = 'Company Link';
//               } else if (/linkedin\.com\/pub\//i.test(link)) {
//                 remark = 'Old_link_check';
//               } else if (!/linkedin\.com\/in\//i.test(link) && !/Linkedin\.Com\/In\//i.test(link) && !/linkedin\.com\/\/in\//i.test(link)) {
//                 remark = 'Junk Link';
//               } else {
//                 remark = 'ok';
//               }

//               let cleanedLink = link;
//               let matchLink = null;
//               let linkedinLinkId = null;

//               if (remark === 'ok') {
//                 cleanedLink = link
//                   .replace(/^(https?:\/\/)?(www\.)?/i, '')
//                   .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
//                   .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
//                   .toLowerCase();

//                 const matched = await MasterUrl.findOne({
//                   where: { clean_linkedin_link: cleanedLink },
//                   attributes: ['linkedin_link_id', 'clean_linkedin_link'],
//                   transaction
//                 });

//                 if (matched) {
//                   matchLink = cleanedLink;
//                   linkedinLinkId = matched.linkedin_link_id;
//                   matchCount++;
//                 }
//               }

//               return {
//                 uniqueId,
//                 email,
//                 link,
//                 totallink: links.length,
//                 clean_link: cleanedLink,
//                 remark,
//                 fileName: req.file.originalname,
//                 matchLink,
//                 linkedin_link_id: linkedinLinkId,
//                 matchCount,
//               };
//             }));

//             await Link.bulkCreate(batchInserts, { transaction });
//             await transaction.commit();
//           } catch (batchError) {
//             await transaction.rollback();
//             throw batchError;
//           }
//         }

//         safeUnlink(filePath);
//       } catch (err) {
//         safeUnlink(filePath);
//         throw err;
//       }
//     }

//     // Process credits if requested
//     if (processCredits && uniqueId) {
//       const transaction = await sequelize.transaction();
//       try {
//         const user = await User.findOne({ 
//           where: { userEmail: email },
//           transaction
//         });

//         if (!user) {
//           await transaction.rollback();
//           await cleanup();
//           responseSent = true;
//           return res.status(404).json({ message: 'User not found' });
//         }

//         const creditCost = matchCount * user.creditCostPerLink;
//         if (user.credits < creditCost) {
//           await transaction.rollback();
//           await cleanup();
//           responseSent = true;
//           return res.status(400).json({ message: 'Insufficient credits' });
//         }

//         user.credits -= creditCost;
//         await user.save({ transaction });

//         // Update Link entries with credit info
//         await Link.update(
//           {
//             creditDeducted: creditCost,
//             remainingCredits: user.credits,
//           },
//           { 
//             where: { uniqueId },
//             transaction
//           }
//         );

//         // Create TempLinkMobile records for matched links
//         const matchedLinks = await Link.findAll({
//           where: { 
//             uniqueId,
//             email: email,
//             matchLink: { [Op.ne]: null }
//           },
//           transaction
//         });

//         const tempMobileInserts = matchedLinks.map(link => ({
//           uniqueId: link.uniqueId,
//           matchLink: link.matchLink,
//           linkedin_link_id: link.linkedin_link_id
//         }));

//         await TempLinkMobile.bulkCreate(tempMobileInserts, { transaction });

//         await transaction.commit();

//         // Send notification email
//         try {
//           const mailOptions = {
//             from: "b2bdirectdata@gmail.com",
//             to: email,
//             subject: 'Direct Number Enrichment file uploaded',
//             html: `
//               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                 <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Upload Processed</h2>
//                 <p>Your file has been successfully uploaded.</p>
                
//                 <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
//                   <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
//                   <p><strong>File Name:</strong> ${req.file?.originalname || 'Unknown'}</p>
//                   <p><strong>Total Links Processed:</strong> ${links.length}</p>
//                   <p><strong>Matches Found:</strong> ${matchCount}</p>
//                   <p><strong>Credits Deducted:</strong> ${creditCost}</p>
//                 </div>
                
//                 <p>You can now download the results from your dashboard.</p>
//                 <p>Thank you for using our service!</p>
//                 <p>Team,<br/>B2B Direct Data</p>
//               </div>
//             `
//           };
//           transporter.sendMail(mailOptions).catch(console.error);
//         } catch (emailError) {
//           console.error('Email failed:', emailError);
//         }

//         cleanupRequired = false;
//         await cleanup();
       
//         responseSent = true;
//         return res.json({
//           success: true,
//           message: 'Upload processed successfully',
//           uniqueId,
//           fileName: req.file?.originalname,
//           totallink: links.length,
//           matchCount,
//           updatedCredits: user.credits,
//           tempRecordsCreated: matchedLinks.length
//         });
//       } catch (creditError) {
//         await transaction.rollback();
//         throw creditError;
//       }
//     }

//     // Return response for file processing without credit deduction
//     cleanupRequired = false;
//     await cleanup();
    
//     responseSent = true;
//     return res.json({
//       message: 'Upload successful',
//       uniqueId,
//       fileName: req.file?.originalname,
//       totallink: links.length,
//       matchCount,
//       nextStep: processCredits ? undefined : 'process-credits'
//     });

//   } catch (err) {
//     console.error('Upload/process error:', err);
//     await cleanup();
    
    
    
//     if (!responseSent) {
//       responseSent = true;
//       res.status(500).json({ 
//         error: 'Upload/processing failed', 
//         details: err.message 
//       });
//     }
//   }
// });

// // Helper functions
// function safeUnlink(path) {
//   try {
//     if (fs.existsSync(path)) {
//       fs.unlinkSync(path);
//     }
//   } catch (err) {
//     console.error('Error deleting file:', err);
//   }
// }

// async function setProcessingFalse(email) {
//   try {
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: false }
//     );
//   } catch (error) {
//     console.error('Error setting processing to false:', error);
//   }
// }


// const authMiddleware = require("../backend/middleware/authMiddleware")

  
//   // backend/server.js
//   app.post('/get-links', authMiddleware, async (req, res) => {
//     try {
//       const email = req.headers['user-email'];
//       if (!email) return res.status(400).json({ error: 'Email required in headers' });
  
//       const userLinks = await Link.findAll({
//         where: { email },
//         order: [['date', 'DESC']], // most recent first
//       });
  
//       res.json(userLinks);
//     } catch (err) {
//       console.error('Error fetching links:', err);
//       res.status(500).json({ error: 'Failed to fetch links' });
//     }
//   });
  
  

  // Add this to your server routes
// app.delete('/cancel-upload/:uniqueId',auth, async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
    
//     // Delete from both tables in a transaction
//     await sequelize.transaction(async (t) => {
//       await TempLinkMobile.destroy({ 
//         where: { uniqueId },
//         transaction: t 
//       });
      
//       await Link.destroy({ 
//         where: { uniqueId },
//         transaction: t 
//       });
//     });

//     res.json({ success: true, message: 'Upload canceled and data deleted' });
//   } catch (err) {
//     console.error('Cancel upload error:', err);
//     res.status(500).json({ error: 'Failed to cancel upload' });
//   }
// });
  


// Add these routes to your Express server

// Check file processing status
app.get('/api/check-file-processing',auth, async (req, res) => {
  try {
    const { userEmail } = req.query;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isProcessingFile === true){
  
        return res.status(404).json({ message: 'File is currently being processed' });
    }

    res.json({ isProcessing: user.isProcessingFile });
  } catch (error) {
    console.error('Error checking file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// In your set-file-processing endpoint
app.post('/api/set-file-processing', async (req, res) => {
  try {
    const { userEmail, isProcessing } = req.body;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      isProcessingFile: isProcessing,
      processingStartTime: isProcessing ? new Date() : null
    };

    await user.update(updateData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


const cron = require('node-cron');
  
// cron.schedule('*/2 * * * * ', async () => {
//   try {
//     console.log('🔄 Cron Job: Syncing TempLinkMobile ➝ Link...');

//     // Fetch all records from TempLinkMobile table
//     const tempRecords = await TempLinkMobile.findAll();

//     for (const temp of tempRecords) {
//       const {
//         id, // required to delete
//         uniqueId,
//         linkedin_link_id,
//         mobile_number,
//         mobile_number_2,
//         person_name,
//         person_location
//       } = temp;

//       // Skip if linkedin_link_id or uniqueId is missing
//       if (!linkedin_link_id || !uniqueId) {
//         console.log(`⚠️ Skipping record: Missing linkedin_link_id or uniqueId`);
//         continue;
//       }

//       // Find matching Link record
//       const linkRecord = await Link.findOne({
//         where: {
//           linkedin_link_id,
//           uniqueId,
//         }
//       });

//       if (!linkRecord) {
//         console.log(`⚠️ No Link found for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId}`);
//         continue;
//       }
// let status;

// if (
//   (mobile_number === null || mobile_number === "N/A") &&
//   (mobile_number_2 === null || mobile_number_2 === "N/A")
// ) {
//   status = "pending";
// } else {
//   status = "completed";
// }

//       // Prepare data for update
//       const updateData = {
//         mobile_number,
//         mobile_number_2,
//         person_name,
//         person_location,
//         status,
//       };

//       const [updated] = await Link.update(updateData, {
//         where: {
//           linkedin_link_id,
//           uniqueId,
//         },
//       });

//       if (updated > 0) {
//         console.log(`✅ Link updated for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId} | Status: ${status}`);

//         // ✅ If status is completed, delete from TempLinkMobile
//         if (status === 'completed') {
//           await TempLinkMobile.destroy({ where: { id } });
//           console.log(`🗑️ Deleted TempLinkMobile record with id: ${id}`);
//         }
//       }
//     }

//     console.log('✅ Sync complete.\n');
//   } catch (err) {
//     console.error('❌ Error during sync:', err);
//   }
// });

cron.schedule('*/3 * * * *', async () => {
  console.log('\n🔄 Starting TempLinkMobile to Link sync job...');

  try {
    // Verify database connection first
    await sequelize.authenticate();
    
    // Process records in batches to prevent memory issues
    let offset = 0;
    const batchSize = 300;
    let hasMoreRecords = true;
    let processedCount = 0;
    let skippedCount = 0;
    let deletedCount = 0;

    while (hasMoreRecords) {
      const tempRecords = await TempLinkMobile.findAll({
        limit: batchSize,
        offset: offset,
       
      });

      if (tempRecords.length === 0) {
        hasMoreRecords = false;
        continue;
      }

      for (const temp of tempRecords) {
        let transaction;
        try {
          transaction = await sequelize.transaction();

          const {
            id,
            uniqueId,
            linkedin_link_id,
            mobile_number,
            mobile_number_2,
            person_name,
            person_location
            
          } = temp;

          // Skip if required fields are missing
          if (!linkedin_link_id || !uniqueId) {
            console.log(`⚠️ Skipping record ${id}: Missing linkedin_link_id or uniqueId`);
            skippedCount++;
            await transaction.commit();
            continue;
          }

          // Find matching Link record
          const linkRecord = await Link.findOne({
            where: { linkedin_link_id, uniqueId },
            transaction
          });

          if (!linkRecord) {
            console.log(`⚠️ No Link found for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId}`);
            skippedCount++;
            await transaction.commit();
            continue;
          }

          // Determine status
          let status = "pending";
          if (!(
            (mobile_number === null || mobile_number === "N/A") &&
            (mobile_number_2 === null || mobile_number_2 === "N/A")
          )) {
            status = "completed";
          }

          // Update Link record
          const [updated] = await Link.update({
            mobile_number,
            mobile_number_2,
            person_name,
            person_location,
            status
            
            
          }, {
            where: { linkedin_link_id, uniqueId },
            transaction
          });

          if (updated > 0) {
            processedCount++;
            console.log(`✓ Updated Link for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId} | Status: ${status}`);

            // Delete from TempLinkMobile if completed
            if (status === 'completed') {
              await TempLinkMobile.destroy({ 
                where: { id },
                transaction
              });
              deletedCount++;
              console.log(`🗑️ Deleted TempLinkMobile record ${id}`);
            }
          }

          await transaction.commit();
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (recordError) {
          // if (transaction) await transaction.rollback();
          console.error(`⚠️ Error processing record ${temp.id}:`, recordError.message);
          continue;
        }
      }

      offset += batchSize;
    }

    await checkAndUpdateEmailStatus()

    console.log(`✅ Sync completed successfully. Stats:
      - Processed: ${processedCount}
      - Skipped: ${skippedCount}
      - Deleted: ${deletedCount}
    `);

  } catch (jobError) {
    console.error('❌ Error in sync job:', jobError);
  }
});

console.log('⏰ TempLinkMobile sync job scheduled to run every 2 minutes');

// const cron = require('node-cron');


// Configuration
// const BATCH_SIZE = 20;
// const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second
// const CRON_SCHEDULE = '*/1 * * * *'; // Every 5 minutes
// const PROCESSING_DELAY_AFTER_COMPLETION_MS = 60000; // 1 minute

// // State management
// let isProcessing = false;
// let lastProcessedId = 0;

// const processBatch = async () => {
//   if (isProcessing) {
//     console.log('⏳ Processing already in progress. Skipping...');
//     return;
//   }

//   isProcessing = true;
//   console.log('🔄 Cron Job: Syncing TempLinkMobile ➝ Link...');

//   try {
//     // Get distinct users with pending records
//     const usersWithRecords = await TempLinkMobile.findAll({
//       attributes: ['uniqueId'],
//       group: ['uniqueId'],
//       where: {
//         id: { [Op.gt]: lastProcessedId }
//       },
//       limit: BATCH_SIZE
//     });

//     if (usersWithRecords.length === 0) {
//       console.log('ℹ️ No records found. Resetting for next cycle.');
//       lastProcessedId = 0;
//       setTimeout(() => { isProcessing = false; }, PROCESSING_DELAY_AFTER_COMPLETION_MS);
//       return;
//     }

//     for (const user of usersWithRecords) {
//       const { uniqueId } = user;

//       // Process 20 records per user
//       const userRecords = await TempLinkMobile.findAll({
//         where: { uniqueId },
//         limit: BATCH_SIZE,
//         order: [['id', 'ASC']]
//       });

//       for (const temp of userRecords) {
//         const {
//           id,
//           linkedin_link_id,
//           mobile_number,
//           mobile_number_2,
//           person_name,
//           person_location
//         } = temp;

//         if (!linkedin_link_id || !uniqueId) {
//           console.log(`⚠️ Skipping record ${id}: Missing linkedin_link_id or uniqueId`);
//           continue;
//         }

//         const linkRecord = await Link.findOne({
//           where: { linkedin_link_id, uniqueId }
//         });

//         if (!linkRecord) {
//           console.log(`⚠️ No Link found for ${linkedin_link_id}, ${uniqueId}`);
//           continue;
//         }

//         const status = (
//           (mobile_number === null || mobile_number === "N/A") && 
//           (mobile_number_2 === null || mobile_number_2 === "N/A")
//         ) ? "pending" : "completed";

//         const [updated] = await Link.update({
//           mobile_number,
//           mobile_number_2,
//           person_name,
//           person_location,
//           status
//         }, {
//           where: { linkedin_link_id, uniqueId }
//         });

//         if (updated > 0) {
//           console.log(`✅ Updated Link ${linkRecord.id} | Status: ${status}`);
          
//           if (status === 'completed') {
//             await TempLinkMobile.destroy({ where: { id } });
//             console.log(`🗑️ Deleted TempLinkMobile record ${id}`);
//           }
//         }

//         lastProcessedId = Math.max(lastProcessedId, id);
//       }

//       // Delay between user batches
//       await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
//     }

//     console.log('✅ Batch processed. Waiting for next cycle...');
//   } catch (err) {
//     console.error('❌ Error during processing:', err);
//   } finally {
//     isProcessing = false;
//   }
// };

// // Scheduled job
// cron.schedule(CRON_SCHEDULE, () => {
//   if (!isProcessing) {
//     processBatch();
//   } else {
//     console.log('⏳ Previous job still running. Skipping this cycle.');
//   }
// });

// // Initial start
// console.log('⏰ Starting TempLinkMobile sync cron job...');
// processBatch(); // Run immediately on startup


// cron.schedule('*/1 * * * * ', async () => {
//   try {
//     console.log('🔄 Cron Job: Syncing for email ');

//     // Fetch all records from TempLinkMobile table
//     const tempRecords = await Link.findAll();

//     for (const temp of tempRecords) {
//       const {
//         uniqueId

//       } = temp;

//       // Skip if linkedin_link_id or uniqueId is missing
//       if (!linkedin_link_id || !uniqueId) {
//         console.log(`⚠️ Skipping record: Missing linkedin_link_id or uniqueId`);
//         continue;
//       }

     
  
//     }
//     console.log('✅ Sync complete.\n');
//   } catch (err) {
//     console.error('❌ Error during sync:', err);
//   }
// });



// app.get('/check-status-bulk/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     // Find all records with the given uniqueId
//     const records = await Link.findAll({
//       where: { uniqueId },
//       attributes: ['status'] // Only fetch the final_status field
//     });

//     if (records.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No records found with the provided uniqueId'
//       });
//     }

//     // Count records by status
//     const statusCounts = {
//       pending: 0,
//       completed: 0,
//       notAvailable: 0
//     };

//     records.forEach(record => {
//       const status = record.status.toLowerCase();
//       if (status === 'pending') {
//         statusCounts.pending++;
//       } else if (status === 'completed') {
//         statusCounts.completed++;
//       } else if (status === 'not available') {
//         statusCounts.notAvailable++;
//       }
//     });

//     // Determine overall status
//     let overallStatus;
//     if (statusCounts.pending > 0) {
//       overallStatus = 'pending';
//     } else if (statusCounts.completed > 0 || statusCounts.notAvailable > 0) {
//       overallStatus = 'completed';
//     } else {
//       overallStatus = 'unknown'; // fallback for other cases
//     }

//     res.json({
//       success: true,
//       uniqueId,
//       totalRecords: records.length,
//       statusCounts,
//       overallStatus
//     });

//   } catch (error) {
//     console.error('Error checking status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// });



// app.put('/api/update-email-status/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
//     const { savedEmail } = req.body;

//     // First check if an email has already been sent for this uniqueId
//     const existingRecord = await emailsent.findOne({
//       where: { uniqueId }
//     });

//     if (existingRecord) {
//       // If record exists and email was already sent, return without sending again
//       if (existingRecord.emailSent === true) {
//         console.log(`Email already sent for ${uniqueId} to ${savedEmail}`);
//         return res.status(200).json({ message: 'Email already sent' });
//       }
      
//       // If record exists but email wasn't sent, update it
//       await emailsent.update(
//         { emailSent: true, email: savedEmail },
//         { where: { uniqueId } }
//       );
//     } else {
//       // If no record exists, create a new one
//       await emailsent.create({
//         uniqueId,
//         email: savedEmail,
//         emailSent: true
//       });
//     }

//     // Now send the email
//     try {
//       const mailOptions = {
//         from: '"B2B Direct Number Enrichment System" <b2bdirectdata@gmail.com>',
//         to: savedEmail,
//         subject: `B2B Direct Number Enrichment System Completed - ${uniqueId}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #2563eb;"> B2B Direct Number Enrichment System Completed </h2>
//             <p>All enrichment processes for ${uniqueId} have been completed.</p>
            
//             <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
//               <h3 style="margin-top: 0; color: #1f2937;">Direct Number Enrichment</h3>
             
//               <p><strong>file UniqueId</strong> ${uniqueId}</p>
//             </div>
            
//             <p>All results are now available for download.</p>
//             <p>Team,<br/>B2B Direct Data</p>
//           </div>
//         `
//       };

//       await transporter.sendMail(mailOptions);
//       console.log(`Completion email sent for ${uniqueId} to ${savedEmail}`);
//       return res.status(200).json({ message: 'Email sent successfully' });
//     } catch (emailError) {
//       console.error('Failed to send completion email:', emailError);
//       // If email fails, update the record to mark as not sent
//       await emailsent.update(
//         { emailSent: false },
//         { where: { uniqueId } }
//       );
//       return res.status(500).json({ error: 'Failed to send email' });
//     }
//   } catch (error) {
//     console.error('Error in update-email-status:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });






cron.schedule('*/5 * * * *', async () => {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile: true,
        processingStartTime: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000) // older than 5 mins
        }
      }
    });
    
    for (const user of staleUsers) {
      await user.update({ isProcessingFile: false, processingStartTime: null });
      
      
    }
  } catch (error) {
    console.error('Error in processing cleanup job:', error);
  }
});





async function checkAndUpdateEmailStatus() {
  console.log('⏳ Cron Job: Checking matchLink status...');

  try {
    // Step 1: Get all uniqueIds in emailsent with pending status
    const pendingUniqueIds = await emailsent.findAll({
      where: { status: 'pending' },
      attributes: ['uniqueId'],
      group: ['uniqueId']
    });

    for (const record of pendingUniqueIds) {
      const uniqueId = record.uniqueId;

      // Step 2: Get all Link rows for this uniqueId where matchLink is not null
      const matchedLinks = await Link.findAll({
        where: {
          uniqueId,
          matchLink: { [Op.ne]: null }
        },
        attributes: ['status']
      });

      if (matchedLinks.length === 0) {
        console.log(`⚠️ No matchLink found for ${uniqueId}, skipping...`);
        continue;
      }

      // Step 3: Check if all matched links are pending or completed
      const hasPending = matchedLinks.every(link => link.status === 'pending');
      const hasCompleted = matchedLinks.every(link => link.status === 'completed');

      if (hasPending) {
        console.log(`⏳ ${uniqueId} still has pending matchLink rows, skipping completion...`);
        continue;
      }

      if (hasCompleted) {
        // Step 4: If none are pending, update emailsent status to completed
        await emailsent.update(
          { status: 'completed' },
          { where: { uniqueId } }
        );
        await Link.update(
          { final_status: 'completed' },
          { where: { uniqueId } }
        );

        console.log(`✅ ${uniqueId} marked as completed in emailsent`);

        // Step 5: Get email address for this uniqueId
        const emailRecord = await emailsent.findOne({
          where: { uniqueId },
          attributes: ['email']
        });

        if (!emailRecord || !emailRecord.email) {
          console.log(`⚠️ No savedEmail found for ${uniqueId}, skipping email sending...`);
          continue;
        }

        const email = emailRecord.email;

        // Step 6: Send the email
        try {
          const mailOptions = {
            from: '"B2B Direct Number Enrichment System" <b2bdirectdata@gmail.com>',
            to: email,
            subject: `B2B Direct Number Enrichment System Completed - ${uniqueId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">B2B Direct Number Enrichment System Completed</h2>
                <p>All enrichment processes for ${uniqueId} have been completed.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Direct Number Enrichment</h3>
                  <p><strong>File UniqueId:</strong> ${uniqueId}</p>
                </div>
                
                <p>All results are now available for download.</p>
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`📧 Completion email sent to ${email} for ${uniqueId}`);
        } catch (err) {
          console.error(`❌ Failed to send email for ${uniqueId}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in cron job:', error);
  }
}







////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  
  
  
  
  
  
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
  
// const linkRoutes = require('./routes/singleLookup');
// app.use('/api/links', linkRoutes);
  
  
  
  
// app.get('/created-by/:email', async (req, res) => {
//   try {
//     // Verify the requesting user has permission
//     const requestingUser = req.user; // Assuming you have authentication middleware
    
//     // Only allow if the requesting user is an admin or is requesting their own created users
//     if (requestingUser.roleId !== 1 && requestingUser.userEmail !== req.params.email) {
//       return res.status(403).json({
//         success: false,
//         error: "Unauthorized - You can only view users you created"
//       });
//     }

//     // Find all users where createdBy matches the email parameter
//     const createdUsers = await User.findAll({
//       where: {
//         createdBy: req.params.email
//       },
//       attributes: [
//         'userEmail',
//         'companyName',
//         'credits',
//         'createdAt',
//         'lastLogin',
//         'isActive'
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     res.json({
//       success: true,
//       data: createdUsers
//     });

//   } catch (error) {
//     console.error('Error fetching created users:', error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch created users"
//     });
//   }
// });


// In your server routes file (e.g., routes.js or app.js)
const nodemailer = require('nodemailer');

// Configure your email transporter (add this at the top of your file)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "b2bdirectdata@gmail.com", // Your Gmail address
    pass: "npgjrjuebmlmepgy"  // Your Gmail password or app password
  }
});

// Add this route
app.post('/send-upload-notification',auth, async (req, res) => {
  try {
    const { email, fileName, totalLinks, matchCount, creditsDeducted } = req.body;

    const mailOptions = {
      from: "b2bdirectdata@gmail.com",
      to: email,
      subject: 'Your Bulk LinkedIn Lookup Upload Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bulk LinkedIn Lookup - Upload Processed</h2>
          <p>Your file has been successfully processed by our system.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Upload Details</h3>
            <p><strong>File Name:</strong> ${fileName}</p>
            <p><strong>Total Links Processed:</strong> ${totalLinks}</p>
            <p><strong>Matches Found:</strong> ${matchCount}</p>
            <p><strong>Credits Deducted:</strong> ${creditsDeducted}</p>
          </div>
          
          <p>You can download your results from the Bulk Lookup section of your dashboard.</p>
          <p>If you have any questions, please reply to this email.</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});




  
  
  
  
  
  
  
  





// app.patch('/users/update-credit-cost', async (req, res) => {
//   try {
//     const { userEmail, creditCostPerLink } = req.body;

//     // Validate input
//     if (!userEmail || creditCostPerLink === undefined) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Email and credit cost are required' 
//       });
//     }

//     // Alternative update method that works better
//     const user = await User.findOne({ where: { userEmail } });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     user.creditCostPerLink = creditCostPerLink;
//     await user.save();

//     return res.json({ 
//       success: true,
//       message: 'Credit cost updated successfully',
//       newCost: user.creditCostPerLink
//     });

//   } catch (error) {
//     console.error('Error details:', {
//       message: error.message,
//       stack: error.stack,
//       requestBody: req.body
//     });
//     return res.status(500).json({ 
//       success: false,
//       message: 'Server error while updating credit cost',
//       error: error.message 
//     });
//   }
// });



// app.get('/credit-cost', async (req, res) => {
//   try {
//     const userEmail = req.user.email;
//     const user = await User.findOne({
//       where: { userEmail: userEmail },
//       attributes: ['creditCostPerLink']
//     });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({
//       creditCostPerLink: user.creditCostPerLink
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });





app.get('/api/credit-cost', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email query parameter is required'
      });
    }

    const user = await User.findOne({
      where: { userEmail: email },
      attributes: ['creditCostPerLink']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      creditCostPerLink: user.creditCostPerLink
    });
  } catch (error) {
    console.error('Error fetching credit cost:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});






  app.use('/api', require('./routes/file'));

app.use('/api', require('./routes/user'));


sequelize.sync({ alter: true }).then(() => {
  app.listen(8000, () => console.log('Backend running on 8000'));
});  



const userRoutes = require('./routes/userRoutes')
app.use('/users', userRoutes)

// const creditRoutes = require('./routes/creditRoutes')
// app.use('/api', creditRoutes)



const bulklookups = require('./routes/bulklookup')
app.use('/bulklookup', bulklookups)

const creditTransactionRoutes = require("./routes/creditTransactionRoutes");  // Import new routes
app.use("/transactions", creditTransactionRoutes);  



const superAdminRoutes = require('./routes/superAdminRoutes')
app.use('/super-admin', superAdminRoutes);









// Get user credits
app.get('/api/users/credits', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { userEmail: req.query.email },
      attributes: ['credits']
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ credits: user.credits });
  } catch (error) {
    console.error('Credits fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.use(express.urlencoded({ extended: true }));
const paypal = require('@paypal/checkout-server-sdk');



// // Configure PayPal environment
// const environment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_SECRET
// );
// const paypalClient = new paypal.core.PayPalHttpClient(environment);

// app.post('/api/verify-payment', async (req, res) => {
//   console.log('Received payment verification request:', req.body);
  
//   try {
//     const { orderID, email, credits } = req.body;

//     // Validate input
//     if (!orderID || !email || !credits) {
//       console.error('Missing required fields');
//       return res.status(400).json({ 
//         error: 'Missing orderID, email, or credits' 
//       });
//     }

//     // Verify PayPal order
//     console.log('Verifying PayPal order:', orderID);
//     const request = new paypal.orders.OrdersGetRequest(orderID);
//     const order = await paypalClient.execute(request);

//     console.log('PayPal order status:', order.result.status);
    
//     if (order.result.status !== 'COMPLETED') {
//       return res.status(400).json({ 
//         error: 'Payment not completed',
//         status: order.result.status 
//       });
//     }

//     // Update user credits
//     console.log('Updating credits for:', email);
//     const user = await User.findOne({ where: { userEmail: email } });
    
//     if (!user) {
//       console.error('User not found:', email);
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const newCredits = user.credits + Number(credits);
//     await user.update({ credits: newCredits });

//     console.log('Credits updated successfully');
//     return res.json({ 
//       success: true,
//       credits: newCredits,
//       transactionId: order.result.id
//     });

//   } catch (error) {
//     console.error('Payment verification error:', error);
    
//     // Handle specific PayPal errors
//     if (error.statusCode) {
//       return res.status(400).json({
//         error: 'PayPal API error',
//         details: error.message,
//         statusCode: error.statusCode
//       });
//     }

//     // Handle database errors
//     if (error.name === 'SequelizeDatabaseError') {
//       return res.status(500).json({
//         error: 'Database error',
//         details: error.message
//       });
//     }

//     // Generic server error
//     return res.status(500).json({
//       error: 'Internal server error',
//       details: process.env.NODE_ENV === 'development' 
//         ? error.message 
//         : undefined
//     });
//   }
// });




// POST /api/verify-payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { email, creditAmount } = req.body;

    if (!email || !creditAmount || creditAmount <= 0) {
      return res.status(400).json({ message: 'Invalid email or credit amount' });
    }

    const user = await User.findOne({ where: { userEmail: email.toLowerCase().trim() } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add credits to user's account
    user.credits += parseInt(creditAmount);
    await user.save();

    return res.status(200).json({
      message: `Successfully added ${creditAmount} credits to ${email}`,
      updatedCredits: user.credits
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});








////////////contenct verfication///////////

const VerificationUpload = require('./model/verification_upload'); // Correct model name

app.post('/upload-excel-verification',auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });


    // Get credit information from headers
    const creditCost = parseFloat(req.headers['credit-cost']);
    const userCredits = parseFloat(req.headers['user-credits']);

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const links = rows.flat().filter(cell =>
      typeof cell === 'string' &&
      cell.toLowerCase().includes('linkedin.com')
    );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'No LinkedIn links found.' });
    }

     // Check if user has enough credits
    const requiredCredits = creditCost * links.length;
    if (userCredits < requiredCredits) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: `Insufficient credits. You need ${requiredCredits} but only have ${userCredits}` 
      });
    }

     // For any number of links (less than or equal to 1000), require confirmation
    if (links.length < 10000) {
      return res.status(200).json({ 
        message: "Confirmation required to proceed", 
        linkCount: links.length,
        requiresConfirmation: true,
        fileName: req.file.originalname
      });
    }


    if (links.length > 10000) {
       fs.unlinkSync(filePath);
  return res.status(400).json({ message: "Max 10 links allowed" });
}

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});


// app.post('/con-upload-excel-verification',auth, upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

    
//      // Set processing status to true at the start
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );

//         // Initialize variables
    
//     let uniqueId, links = [];
//     const processCredits = req.body.processCredits === 'true';
//     const BATCH_SIZE = 300; // Process 20 links at a time when checking database

//     if (req.file) {
//     const filePath = req.file.path;
//     const workbook = xlsx.readFile(filePath);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//      links = rows.flat().filter(cell =>
//       typeof cell === 'string' &&
//       cell.toLowerCase().includes('linkedin.com')
//     );

//     if (links.length === 0) {
//       fs.unlinkSync(filePath);
//       await setProcessingFalse(email);
//       return res.status(400).json({ message: 'No LinkedIn links found.' });
//     }
//     if (links.length > 10000) {
//        fs.unlinkSync(filePath);
//       await setProcessingFalse(email);
//   return res.status(400).json({ message: "Max 10 links allowed" });
// }


//      uniqueId = uuidv4();
//     let pendingCount = 0; // Initialize pending count

//     const categorizedLinks = links.map(link => {
//       let remark;
     
//       if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } else if (/linkedin\.com\/company/i.test(link)) {
//         remark = 'Company Link';
//       } else if (/linkedin\.com\/pub\//i.test(link)) {
//         remark = 'This page doesn’t exist';
//       } else if (!/linkedin\.com\/in\//i.test(link)) {
//         remark = 'Junk Link';
//       } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
//         remark = 'Invalid Profile Link';
//       } else {
//         remark = 'pending';
//         pendingCount++; // Increment pending count
//       }

//       return {
//         uniqueId,
//         email,
//         link,
//         totallink: links.length,
//         clean_link: link,
//         remark,
//         fileName: req.file.originalname,
//         pendingCount // Include pending count in each record (optional)
//       };
//     });

//     // Save to database
//     await VerificationUpload.bulkCreate(categorizedLinks);
//     fs.unlinkSync(filePath);

//     res.json({
//       message: 'Links categorized successfully',
//       uniqueId,
//       fileName: req.file.originalname,
//       totalLinks: links.length,
//       pendingCount, // Send pending count in response
//       categorizedLinks: categorizedLinks.map(l => ({
//         link: l.link,
//         remark: l.remark
//       })),
//       date: new Date().toISOString(),
//       nextStep: 'confirm'
//     });

//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     res.status(500).json({ error: 'Upload failed', details: err.message });
//   }
// });


// const VerificationTemp = require('./model/verification_temp');

// app.post('/process-matching/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
//     const email = req.headers['user-email'];

//     if (!email) return res.status(400).json({ error: "Email required" });

//     const pendingLinks = await VerificationUpload.findAll({
//       where: { uniqueId, email, remark: 'pending' }
//     });

//     let insertedCount = 0;
//     let updatedCount = 0;

//     for (const linkRecord of pendingLinks) {
//       let cleanedLink = linkRecord.link
//         .trim()
//         .replace(/^(https?:\/\/)?(www\.)?/i, 'https://www.') // ensure https://www.
//         .replace(/linkedin\.com\/+in\/+/i, 'linkedin.com/in/') // normalize /in/
//         .toLowerCase();

//       // Remove trailing slashes before appending details
//       cleanedLink = cleanedLink.replace(/\/+$/, '');

//       // Ensure it ends with /details/experience/
//       if (!cleanedLink.includes('/details/experience/')) {
//         cleanedLink = `${cleanedLink}/details/experience/`;
//       }

//       // Update the clean_link in verification_upload table
//       await VerificationUpload.update(
//         { clean_link: cleanedLink },
//         { where: { id: linkRecord.id } }
//       );
//       updatedCount++;

//       // Insert into temp table including the link_id
//       await VerificationTemp.create({
//         uniqueId,
//         clean_linkedin_link: cleanedLink,
//         link_id: linkRecord.link_id, // Add this line to include the link_id
//         remark: 'pending',
//         // Add all the additional fields from verification_upload
//         full_name: linkRecord.full_name,
//         head_title: linkRecord.head_title,
//         head_location: linkRecord.head_location,
//         title_1: linkRecord.title_1,
//         company_1: linkRecord.company_1,
//         company_link_1: linkRecord.company_link_1,
//         exp_duration: linkRecord.exp_duration,
//         exp_location: linkRecord.exp_location,
//         job_type: linkRecord.job_type,
//         title_2: linkRecord.title_2,
//         company_2: linkRecord.company_2,
//         company_link_2: linkRecord.company_link_2,
//         exp_duration_2: linkRecord.exp_duration_2,
//         exp_location_2: linkRecord.exp_location_2,
//         job_type_2: linkRecord.job_type_2,
//         final_remarks: linkRecord.final_remarks,
//         list_contacts_id: linkRecord.list_contacts_id,
//         url_id: linkRecord.url_id
//       });

//       insertedCount++;
//     }

//     res.json({
//       message: 'Processed and updated links successfully',
//       uniqueId,
//       insertedCount,
//       updatedCount,
//       totalPending: pendingLinks.length,
//       status: 'success'
//     });

//   } catch (err) {
//     console.error('Processing error:', err);
//     res.status(500).json({ 
//       error: 'Processing failed', 
//       details: err.message,
//       status: 'error'
//     });
//   }
// });

const VerificationTemp = require('./model/verification_temp');

// app.post('/con-upload-excel-verification', auth, upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

//     // Set processing status to true at the start
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );

//     // Initialize variables
//     let uniqueId, links = [];
//     const processCredits = req.body.processCredits === 'true';
//     const BATCH_SIZE = 300;

//     if (req.file) {
//       const filePath = req.file.path;
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//       links = rows.flat().filter(cell =>
//         typeof cell === 'string' &&
//         cell.toLowerCase().includes('linkedin.com')
//       );

//       if (links.length === 0) {
//         fs.unlinkSync(filePath);
//         await setProcessingFalse(email);
//         return res.status(400).json({ message: 'No LinkedIn links found.' });
//       }
//       if (links.length > 10000) {
//         fs.unlinkSync(filePath);
//         await setProcessingFalse(email);
//         return res.status(400).json({ message: "Max 10,000 links allowed" });
//       }

//       uniqueId = uuidv4();
//       let pendingCount = 0;

//       // Step 1: Categorize links
//       const categorizedLinks = links.map(link => {
//         let remark;
        
//         if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
//           remark = 'Sales Navigator Link';
//         } else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
//           remark = 'Sales Navigator Link';
//         } else if (/linkedin\.com\/company/i.test(link)) {
//           remark = 'Company Link';
//         } else if (/linkedin\.com\/pub\//i.test(link)) {
//           remark = "This page doesn't exist";
//         } else if (!/linkedin\.com\/in\//i.test(link)) {
//           remark = 'Junk Link';
//         } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
//           remark = 'Invalid Profile Link';
//         } else {
//           remark = 'pending';
//           pendingCount++;
//         }

//         return {
//           uniqueId,
//           email,
//           link,
//           totallink: links.length,
//           clean_link: link,
//           remark,
//           fileName: req.file.originalname,
//           pendingCount
//         };
//       });

//       // Save to database
//       await VerificationUpload.bulkCreate(categorizedLinks);
//       fs.unlinkSync(filePath);

//       // Step 2: Process pending links if processCredits is true
//       if (processCredits && pendingCount > 0) {
//         const pendingLinks = await VerificationUpload.findAll({
//           where: { uniqueId, email, remark: 'pending' }
//         });

//         let insertedCount = 0;
//         let updatedCount = 0;

//         for (const linkRecord of pendingLinks) {
//           let cleanedLink = linkRecord.link
//             .trim()
//             .replace(/^(https?:\/\/)?(www\.)?/i, 'https://www.')
//             .replace(/linkedin\.com\/+in\/+/i, 'linkedin.com/in/')
//             .toLowerCase();

//           cleanedLink = cleanedLink.replace(/\/+$/, '');

//           if (!cleanedLink.includes('/details/experience/')) {
//             cleanedLink = `${cleanedLink}/details/experience/`;
//           }

//           // Update the clean_link in verification_upload table
//           await VerificationUpload.update(
//             { clean_link: cleanedLink },
//             { where: { id: linkRecord.id } }
//           );
//           updatedCount++;

//           // Insert into temp table including the link_id
//           await VerificationTemp.create({
//             uniqueId,
//             clean_linkedin_link: cleanedLink,
//             link_id: linkRecord.link_id,
//             remark: 'pending',
//             full_name: linkRecord.full_name,
//             head_title: linkRecord.head_title,
//             head_location: linkRecord.head_location,
//             title_1: linkRecord.title_1,
//             company_1: linkRecord.company_1,
//             company_link_1: linkRecord.company_link_1,
//             exp_duration: linkRecord.exp_duration,
//             exp_location: linkRecord.exp_location,
//             job_type: linkRecord.job_type,
//             title_2: linkRecord.title_2,
//             company_2: linkRecord.company_2,
//             company_link_2: linkRecord.company_link_2,
//             exp_duration_2: linkRecord.exp_duration_2,
//             exp_location_2: linkRecord.exp_location_2,
//             job_type_2: linkRecord.job_type_2,
//             final_remarks: linkRecord.final_remarks,
//             list_contacts_id: linkRecord.list_contacts_id,
//             url_id: linkRecord.url_id
//           });

//           insertedCount++;
//         }

//         return res.json({
//           message: 'File processed and links matched successfully',
//           uniqueId,
//           fileName: req.file.originalname,
//           totalLinks: links.length,
//           pendingCount,
//           insertedCount,
//           updatedCount,
//           categorizedLinks: categorizedLinks.map(l => ({
//             link: l.link,
//             remark: l.remark
//           })),
//           date: new Date().toISOString(),
//           status: 'complete'
//         });
//       }

//       return res.json({
//         message: 'Links categorized successfully',
//         uniqueId,
//         fileName: req.file.originalname,
//         totalLinks: links.length,
//         pendingCount,
//         categorizedLinks: categorizedLinks.map(l => ({
//           link: l.link,
//           remark: l.remark
//         })),
//         date: new Date().toISOString(),
//         nextStep: processCredits ? 'complete' : 'confirm',
//         status: 'categorized'
//       });
//     }

//     return res.status(400).json({ error: 'No file uploaded' });
//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     await setProcessingFalse(email);
//     res.status(500).json({ error: 'Upload failed', details: err.message });
//   }
// });



// app.post('/con-upload-excel-verification', auth, upload.single('file'), async (req, res) => {
//   let email;
//   try {
//     email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

    

//     // Set processing status to true at the start
//     await setProcessingStatus1(email, true);

//     // Initialize variables
//     let uniqueId, links = [];
//     const processCredits = req.body.processCredits === 'true';
//     const BATCH_SIZE = 300;

//     if (!req.file) {
//       await setProcessingStatus1(email, false);
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const filePath = req.file.path;
//     let workbook, sheet, rows;

//     try {
//       workbook = xlsx.readFile(filePath);
//       sheet = workbook.Sheets[workbook.SheetNames[0]];
//       rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
//     } catch (err) {
//       await cleanup(filePath, email);
//       return res.status(400).json({ message: 'Invalid Excel file format' });
//     }

//     links = rows.flat().filter(cell =>
//       typeof cell === 'string' &&
//       cell.toLowerCase().includes('linkedin.com')
//     );

//     if (links.length === 0) {
//       await cleanup(filePath, email);
//       return res.status(400).json({ message: 'No LinkedIn links found.' });
//     }
//     if (links.length > 10000) {
//       await cleanup(filePath, email);
//       return res.status(400).json({ message: "Max 10,000 links allowed" });
//     }

//     uniqueId = uuidv4();
//     let pendingCount = 0;

//     // Step 1: Categorize links
//     const categorizedLinks = links.map(link => {
//       let remark;
      
//       if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } else if (/linkedin\.com\/company/i.test(link)) {
//         remark = 'Company Link';
//       } else if (/linkedin\.com\/pub\//i.test(link)) {
//         remark = "This page doesn't exist";
//       } else if (!/linkedin\.com\/in\//i.test(link)) {
//         remark = 'Junk Link';
//       } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
//         remark = 'Invalid Profile Link';
//       } else {
//         remark = 'pending';
//         pendingCount++;
//       }

//       return {
//         uniqueId,
//         email,
//         link,
//         totallink: links.length,
//         clean_link: link,
//         remark,
//         fileName: req.file.originalname,
//         pendingCount
//       };
//     });

//     // Save to database
//     await VerificationUpload.bulkCreate(categorizedLinks);
    
//     // Always clean up the file after processing
//     try {
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     } catch (err) {
//       console.error('Error deleting file:', err);
//     }

   

//     // Step 2: Process pending links if processCredits is true
//     if (processCredits && pendingCount > 0) {
//       // First check if user has enough credits
//       const user = await User.findOne({ where: { userEmail: email } });

//        const creditsToDeduct = pendingCount * user.creditCostPerLink_V;
//       if (!user) {
//         await VerificationUpload.destroy({ where: { uniqueId } });
//         await setProcessingStatus1(email, false);
//         return res.status(404).json({ message: 'User not found' });
//       }

//       if (user.credits < creditsToDeduct) {
//         await VerificationUpload.destroy({ where: { uniqueId } });
//         await setProcessingStatus1(email, false);
//         return res.status(400).json({ 
//           message: 'Insufficient credits',
//           requiredCredits: creditsToDeduct,
//           currentCredits: user.credits
//         });
//       }
      
//       // Deduct credits after successful processing
//       user.credits = user.credits - creditsToDeduct; // Ensure we don't get NaN
//       await user.save();

//       // Update all VerificationUpload records with credits info
//       await VerificationUpload.update(
//         { 
//           creditsUsed: creditsToDeduct,
//           remainingCredits: user.credits 
//         },
//         { where: { uniqueId } }
//       );

//       // Process the pending links
//       const pendingLinks = await VerificationUpload.findAll({
//         where: { uniqueId, email, remark: 'pending' }
//       });

//       let insertedCount = 0;
//       let updatedCount = 0;

//       for (const linkRecord of pendingLinks) {
//         let cleanedLink = linkRecord.link
//           .trim()
//           .replace(/^(https?:\/\/)?(www\.)?/i, 'https://www.')
//           .replace(/linkedin\.com\/+in\/+/i, 'linkedin.com/in/')
//           .toLowerCase();

//         cleanedLink = cleanedLink.replace(/\/+$/, '');

//         if (!cleanedLink.includes('/details/experience/')) {
//           cleanedLink = `${cleanedLink}/details/experience/`;
//         }

//         // Update the clean_link in verification_upload table
//         await VerificationUpload.update(
//           { clean_link: cleanedLink },
//           { where: { id: linkRecord.id } }
//         );
//         updatedCount++;



//         // Insert into temp table
//         await VerificationTemp.create({
//           uniqueId,
//           clean_linkedin_link: cleanedLink,
//           link_id: linkRecord.link_id,
//           remark: 'pending',
//           full_name: linkRecord.full_name,
//           head_title: linkRecord.head_title,
//           head_location: linkRecord.head_location,
//           title_1: linkRecord.title_1,
//           company_1: linkRecord.company_1,
//           company_link_1: linkRecord.company_link_1,
//           exp_duration: linkRecord.exp_duration,
//           exp_location: linkRecord.exp_location,
//           job_type: linkRecord.job_type,
//           title_2: linkRecord.title_2,
//           company_2: linkRecord.company_2,
//           company_link_2: linkRecord.company_link_2,
//           exp_duration_2: linkRecord.exp_duration_2,
//           exp_location_2: linkRecord.exp_location_2,
//           job_type_2: linkRecord.job_type_2,
//           final_remarks: linkRecord.final_remarks,
//           list_contacts_id: linkRecord.list_contacts_id,
//           url_id: linkRecord.url_id
//         });

//         insertedCount++;
//       }


//       await setProcessingStatus1(email, false);
       

//       try {
//     // Validate recipient email
//     if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Invalid recipient email address'
//       });
//     }

//     const mailOptions = {
//       from: `"B2B Full Details" <b2bdirectdata@gmail.com>`,
//       to: email,
//       subject: `Please Start Full Details`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #2563eb;">Link Uploaded. Please Start Full Details</h2>
          
//           <p><strong>Total Links:</strong> ${links.length}</p>
          
//           <p>Team,<br/>B2B Direct Data</p>
//         </div>
//       `
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log(`Email sent to ${email}`, info.messageId);
//     res.json({ success: true, messageId: info.messageId });
//   } catch (error) {
//     console.error(`Error sending to ${email}:`, error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message,
//       details: 'Failed to send confirmation email'
//     });
//   }

//       return res.json({
//         message: 'File processed, links matched, and credits deducted successfully',
//         uniqueId,
//         fileName: req.file.originalname,
//         totalLinks: links.length,
//         pendingCount,
//         insertedCount,
//         updatedCount,
//         creditsDeducted: creditsToDeduct,
//         updatedCredits: user.credits,
//         categorizedLinks: categorizedLinks.map(l => ({
//           link: l.link,
//           remark: l.remark
//         })),
//         date: new Date().toISOString(),
//         status: 'complete'
//       });
//     }

//     await setProcessingStatus1(email, false);
//     return res.json({
//       message: 'Links categorized successfully',
//       uniqueId,
//       fileName: req.file.originalname,
//       totalLinks: links.length,
//       pendingCount,
      
//       categorizedLinks: categorizedLinks.map(l => ({
//         link: l.link,
//         remark: l.remark
//       })),
//       date: new Date().toISOString(),
//       nextStep: processCredits ? 'complete' : 'confirm',
//       status: 'categorized'
//     });

//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) {
//       try {
//         if (fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }
//       } catch (unlinkErr) {
//         console.error('Error deleting file:', unlinkErr);
//       }
//     }
//     await setProcessingStatus1(email, false);
  
//   }
// });

// // Helper functions
// async function setProcessingStatus1(email, isProcessing) {
//   try {
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing1`,
//       { userEmail: email, isProcessing }
//     );
//   } catch (error) {
//     console.error('Error setting processing status:', error);
//   }
// }

// async function cleanup(filePath, email) {
//   try {
//     if (filePath && fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (err) {
//     console.error('Error cleaning up file:', err);
//   }
//   await setProcessingStatus1(email, false);
// }

app.post('/con-upload-excel-verification', auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

    // Set processing status to true at the start
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing1`,
      { userEmail: email, isProcessing: true }
    );

    // Initialize variables
    let uniqueId, links = [];
    const processCredits = req.body.processCredits === 'true';
    const BATCH_SIZE = 200;

    if (req.file) {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      // Extract and filter LinkedIn links
      links = rows.flat().filter(cell => 
        typeof cell === 'string' && 
        cell.toLowerCase().includes('linkedin.com')
      );

      if (links.length === 0) {
        fs.unlinkSync(filePath);
        await setProcessingFalse2(email);
        return res.status(400).json({ message: 'No LinkedIn links found.' });
      }

      if (links.length > 5000) {
        fs.unlinkSync(filePath);
        await setProcessingFalse2(email);
        return res.status(400).json({ message: "Max 5,000 links allowed" });
      }

      uniqueId = uuidv4();
      let pendingCount = 0;

      // First pass: Process all links to categorize them
      for (const link of links) {
        let remark;
        
        if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
          remark = 'Sales Navigator Link';
        } else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
          remark = 'Sales Navigator Link';
        } else if (/linkedin\.com\/company/i.test(link)) {
          remark = 'Company Link';
        } else if (/linkedin\.com\/pub\//i.test(link)) {
          remark = "This page doesn't exist";
        } else if (!/linkedin\.com\/in\//i.test(link)) {
          remark = 'Junk Link';
        } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
          remark = 'Invalid Profile Link';
        } else {
          remark = 'pending';
          pendingCount++;
        }

        let cleanedLink = remark === 'pending' 
          ? link
              .trim()
              .replace(/^(https?:\/\/)?(www\.)?/i, '')
              .replace(/linkedin\.com\/+in\/+/i, 'linkedin.com/in/')
              .toLowerCase()
              .replace(/\/+$/, '')
              .concat('/details/experience/')
          : null;

        // Create record individually instead of bulkCreate
        await VerificationUpload.create({
          uniqueId,
          email,
          link,
          totallink: links.length,
          clean_link: cleanedLink,
          remark,
          fileName: req.file.originalname,
          pendingCount
        });
      }

      await emailsent1.create({
          uniqueId,
          email
     });

      
      fs.unlinkSync(filePath);

      // If there are pending links, process them in batches
      if (pendingCount > 0) {
        let offset = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        while (true) {
          const batch = await VerificationUpload.findAll({
            where: { uniqueId, email, remark: 'pending' },
            limit: BATCH_SIZE,
            offset: offset,
            order: [['id', 'ASC']]
          });

          if (batch.length === 0) break;

          for (const linkRecord of batch) {
            if (linkRecord.clean_link) {
              // Update verification_upload table
              await VerificationUpload.update(
                { clean_link: linkRecord.clean_link },
                { where: { id: linkRecord.id } }
              );
              updatedCount++;

              // Insert into verification_temp table
              await VerificationTemp.create({
                uniqueId,
                clean_linkedin_link: linkRecord.clean_link,
                link_id: linkRecord.link_id,
                remark: 'pending',
                full_name: linkRecord.full_name,
                head_title: linkRecord.head_title,
                head_location: linkRecord.head_location,
                title_1: linkRecord.title_1,
                company_1: linkRecord.company_1,
                company_link_1: linkRecord.company_link_1,
                exp_duration: linkRecord.exp_duration,
                exp_location: linkRecord.exp_location,
                job_type: linkRecord.job_type,
                title_2: linkRecord.title_2,
                company_2: linkRecord.company_2,
                company_link_2: linkRecord.company_link_2,
                exp_duration_2: linkRecord.exp_duration_2,
                exp_location_2: linkRecord.exp_location_2,
                job_type_2: linkRecord.job_type_2,
                final_remarks: linkRecord.final_remarks,
                list_contacts_id: linkRecord.list_contacts_id,
                url_id: linkRecord.url_id
              });
              insertedCount++;
            }
          }

          offset += BATCH_SIZE;
        }

        // Process credits if requested
        if (processCredits) {
          const user = await User.findOne({ where: { userEmail: email } });
          if (!user) {
            await VerificationUpload.destroy({ where: { uniqueId } });
            await setProcessingFalse2(email);
            return res.status(404).json({ message: 'User not found' });
          }

          const creditsToDeduct = pendingCount * user.creditCostPerLink_V;
          if (user.credits < creditsToDeduct) {
            await VerificationUpload.destroy({ where: { uniqueId } });
            await setProcessingFalse2(email);
            return res.status(400).json({ 
              message: 'Insufficient credits',
              requiredCredits: creditsToDeduct,
              currentCredits: user.credits
            });
          }

          // Update records with credit info
          await VerificationUpload.update(
            { 
              creditsUsed: creditsToDeduct,
              remainingCredits: user.credits - creditsToDeduct
            },
            { where: { uniqueId } }
          );

          // Deduct credits
          user.credits -= creditsToDeduct;
          await user.save();

          await setProcessingFalse2(email);

          // Send completion email
          try {
            const mailOptions = {
              from: "b2bdirectdata@gmail.com",
              to: email,
              subject: 'LinkedIn Verification - Processing',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">LinkedIn Verification - Processing</h2>
                  
                  
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Processing Details</h3>
                    <p><strong>File Name:</strong> ${req.file.originalname}</p>
                    <p><strong>Total Links:</strong> ${links.length}</p>
                    <p><strong>Pending Links Processed:</strong> ${pendingCount}</p>
                    <p><strong>Credits Deducted:</strong> ${creditsToDeduct}</p>
                  </div>
                  
                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
              `
            };
            transporter.sendMail(mailOptions).catch(console.error);
          } catch (emailError) {
            console.error('Email failed:', emailError);
          }

          return res.json({
            message: 'Processing completed successfully',
            uniqueId,
            fileName: req.file.originalname,
            totalLinks: links.length,
            pendingCount,
            creditsDeducted: creditsToDeduct,
            remainingCredits: user.credits,
            date: new Date().toISOString()
          });
        }

        return res.json({
          message: 'Links processed successfully (credits not deducted)',
          uniqueId,
          fileName: req.file.originalname,
          totalLinks: links.length,
          pendingCount,
          date: new Date().toISOString(),
          nextStep: 'confirm-credits'
        });
      }

      return res.json({
        message: 'Links categorized successfully (no pending links to process)',
        uniqueId,
        fileName: req.file.originalname,
        totalLinks: links.length,
        date: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    
  
    
    await setProcessingFalse2(email);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message 
    });
  }
});

// Helper function to set processing status to false
async function setProcessingFalse2(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing1`,
      { userEmail: email, isProcessing: false }
    );
  } catch (err) {
    console.error('Error setting processing status to false:', err);
  }
}

// Add these routes to your Express server

// Check file processing status
app.get('/api/check-file-processing1',auth, async (req, res) => {
  try {
    const { userEmail } = req.query;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isProcessingFile1 === true){
  
        return res.status(404).json({ message: 'File is currently being processed' });
    }

    res.json({ isProcessing: user.isProcessingFile1 });
  } catch (error) {
    console.error('Error checking file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// In your set-file-processing endpoint
app.post('/api/set-file-processing1', async (req, res) => {
  try {
    const { userEmail, isProcessing } = req.body;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      isProcessingFile1: isProcessing,
      processingStartTime1: isProcessing ? new Date() : null
    };

    await user.update(updateData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/get-verification-links',auth, async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    
    if (!userEmail || userEmail === 'Guest') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Fetch all verification uploads for this user
    const uploads = await VerificationUpload.findAll({
      where: { email: userEmail },
      order: [['id', 'DESC']] // Newest first
    });

    if (!uploads || uploads.length === 0) {
      return res.status(200).json([]);
    }

    // Group by uniqueId and transform data
    const result = uploads.reduce((acc, upload) => {
      const existingGroup = acc.find(g => g.uniqueId === upload.uniqueId);
      const linkData = {
        id: upload.id,
        link: upload.link,
        clean_link: upload.clean_link,
        remark: upload.remark || 'pending',
       
        date: upload.date
      };

      if (existingGroup) {
        existingGroup.links.push(linkData);
        existingGroup.totalLinks += 1;
        if (upload.remark === 'pending') existingGroup.pendingCount += 1;
        if (upload.matchLink) existingGroup.matchCount += 1;
      } else {
        acc.push({
          uniqueId: upload.uniqueId,
          fileName: upload.fileName,
          date: upload.date,
          totalLinks: 1,
          pendingCount: upload.remark === 'pending' ? 1 : 0,
          matchCount: upload.matchLink ? 1 : 0,
         creditsUsed: upload.creditsUsed,
          status: upload.remark === 'pending' ? 'pending' : 'completed',
          links: [linkData]
        });
      }
      return acc;
    }, []);

    // Calculate totals and status for each group
    result.forEach(group => {
      group.creditDeducted = group.matchCount * 2;
      group.status = group.pendingCount > 0 ? 'pending' : 'completed';
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching verification links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.post('/api/deduct-credits_v',auth, async (req, res) => {
  try {
    const { userEmail, credits, uniqueId } = req.body;

    if (!userEmail || !credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credit deduction request' });
    }

    const user = await User.findOne({ where: { userEmail } });


    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.credits < 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    user.credits -= credits;
    await user.save();

     // Update all VerificationUpload records with this uniqueId to include the credits used
    await VerificationUpload.update(
      { creditsUsed: credits,
        remainingCredits: user.credits },
      { where: { uniqueId } }
    );

    res.json({ updatedCredits: user.credits });

  } catch (err) {
    console.error('Credit deduction error:', err);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});



// Add this to your backend routes (e.g., in your Express server)
app.delete('/api/delete-verification-uploads/:uniqueId',auth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    if (!uniqueId) {
      return res.status(400).json({ error: 'Unique ID is required' });
    }

    const result = await VerificationUpload.destroy({
      where: { uniqueId }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'No records found to delete' });
    }

    res.json({ 
      success: true,
      message: `Deleted ${result} verification uploads`
    });
  } catch (error) {
    console.error('Error deleting verification uploads:', error);
    res.status(500).json({ error: 'Failed to delete verification uploads' });
  }
});


// Add this to your backend routes
// In your backend route handler
app.get('/api/verification-uploads/:uniqueId', auth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    // Get all records for this uniqueId
    const records = await VerificationUpload.findAll({
      where: { uniqueId }
    });

    // Calculate group status (same logic as frontend)
    const getGroupStatus = (group) => {
      if (!group || group.length === 0) return "completed";
      
      const hasPending = group.some(item => 
        item.remark === 'pending' || 
        (!item.matchLink && item.remark !== 'invalid')
      );
      
      const allCompleted = group.every(item => 
        item.matchLink || 
        item.remark === 'invalid' || 
        item.remark === 'processed'
      );

      if (hasPending) return "pending";
      if (allCompleted) return "completed";
      return "incompleted";
    };

    const groupStatus = getGroupStatus(records);

    // Add status to each record
    const responseData = records.map(record => ({
      ...record.get({ plain: true }),
      groupStatus // Add the calculated group status
    }));

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Route to get all team emails from database
app.get('/get/team-emails',auth, async (req, res) => {
  try {
    // Fetch all team emails from database
    const teamEmails = await TeamEmail.findAll({
      attributes: ['id', 'email', 'name'],
      order: [['created_at', 'DESC']],
      where: {
        // Optional: add any filters you need
        // For example, only active emails:
        // is_active: true
      }
    });

    // Format the response
    const response = {
      success: true,
      data: teamEmails.map(email => ({
        id: email.id,
        email: email.email,
        name: email.name
      })),
      count: teamEmails.length,
      message: 'Team emails retrieved successfully'
    };

    console.log(`Fetched ${response.count} team emails`);
    res.json(response);

  } catch (error) {
    console.error('Error fetching team emails:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team emails',
      error: error.message,
    
    });
  }
});



// Email confirmation endpoint
app.post('/api/send-verification-confirmation/link',auth, async (req, res) => {
  const { email, uniqueId, totalLinks, pendingCount, creditCost, initiatedBy } = req.body;

  try {
    // Validate recipient email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid recipient email address'
      });
    }

    const mailOptions = {
      from: `"B2B Full Details" <b2bdirectdata@gmail.com>`,
      to: email,
      subject: `Please Start Full Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Link Uploaded. Please Start Full Details</h2>
          
          <p><strong>Total Links:</strong> ${totalLinks}</p>
          
          <p>Team,<br/>B2B Direct Data</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`, info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error(`Error sending to ${email}:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: 'Failed to send confirmation email'
    });
  }
});



// app.post('/sync-temp-to-main/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
    
//     // Get all records from temp table for this uniqueId
//     const tempRecords = await VerificationTemp.findAll({
//       where: { uniqueId }
//     });

//     let updatedCount = 0;
//     let skippedCount = 0;
//     let markedCompletedCount = 0;
//     let deletedCount = 0;

//     for (const tempRecord of tempRecords) {
//       // Convert to plain object to better check values
//       const tempData = tempRecord.get({ plain: true });
      
//       // Debug logging
//       console.log('Processing record:', {
//         id: tempData.id,
//         final_remarks: tempData.final_remarks,
//         list_contacts_id: tempData.list_contacts_id,
//         currentStatus: tempData.status
//       });

//       // Check if both fields have valid values (not null/undefined and not empty strings)
//       const hasValidFinalRemarks = tempData.final_remarks && 
//                                  tempData.final_remarks.trim() !== '';
//       const hasValidContactsId = tempData.list_contacts_id && 
//                                 tempData.list_contacts_id.trim() !== '';
//       const shouldMarkCompleted = hasValidFinalRemarks && hasValidContactsId;

//       // Prepare update data for main table
//       const updateData = {
//         full_name: tempRecord.full_name,
//         head_title: tempRecord.head_title,
//         head_location: tempRecord.head_location,
//         title_1: tempRecord.title_1,
//         company_1: tempRecord.company_1,
//         company_link_1: tempRecord.company_link_1,
//         exp_duration: tempRecord.exp_duration,
//         exp_location: tempRecord.exp_location,
//         job_type: tempRecord.job_type,
//         title_2: tempRecord.title_2,
//         company_2: tempRecord.company_2,
//         company_link_2: tempRecord.company_link_2,
//         exp_duration_2: tempRecord.exp_duration_2,
//         exp_location_2: tempRecord.exp_location_2,
//         job_type_2: tempRecord.job_type_2,
//         final_remarks: tempRecord.final_remarks,
//         list_contacts_id: tempRecord.list_contacts_id,
//         url_id: tempRecord.url_id,
//         last_sync: new Date()
//       };

//       // FORCE STATUS UPDATE
//       if (shouldMarkCompleted) {
//         updateData.status = 'Completed'; 
//        // Note the capital 'C' to match your model
//       }

//       // Update main table
//       const [updated] = await VerificationUpload.update(updateData, {
//         where: { 
//           uniqueId,
//           link_id: tempData.link_id
//         }
//       });

//       if (updated > 0) {
//         updatedCount++;
        
//         // If marked as completed, delete from temp table
//         if (shouldMarkCompleted) {
//           const deleted = await VerificationTemp.destroy({
//             where: { id: tempData.id }
//           });

//           if (deleted > 0) {
//             markedCompletedCount++;
//             deletedCount++;
//             console.log(`Marked as completed and deleted temp record ${tempData.id}`);
//           }
//         }
//       } else {
//         skippedCount++;
//         console.warn(`No matching record found for link_id: ${tempData.link_id}`);
//       }
//     }

//     res.json({
//       success: true,
//       message: `Sync completed - Updated ${updatedCount} records (${markedCompletedCount} marked as completed and deleted), skipped ${skippedCount}`,
//       uniqueId,
//       updatedCount,
//       markedCompletedCount,
//       deletedCount,
//       skippedCount,
//       totalRecords: tempRecords.length
//     });

//   } catch (error) {
//     console.error('Sync error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to sync temp data to main table',
//       details: error.message
//     });
//   }
// });


// Scheduled job to sync VerificationTemp to VerificationUpload
cron.schedule('*/3 * * * *', async () => {
  console.log('\n🔄 Starting VerificationTemp to VerificationUpload sync job...');

  try {
    // Verify database connection first
    await sequelize.authenticate();
    
    // Process records in batches to prevent memory issues
    let offset = 0;
    const batchSize = 300;
    let hasMoreRecords = true;
    let processedCount = 0;
    let skippedCount = 0;
    let markedCompletedCount = 0;
    let deletedCount = 0;

    while (hasMoreRecords) {
      const tempRecords = await VerificationTemp.findAll({
        limit: batchSize,
        offset: offset,
        
      });

      if (tempRecords.length === 0) {
        hasMoreRecords = false;
        continue;
      }

      for (const tempRecord of tempRecords) {
        let transaction;
        try {
          transaction = await sequelize.transaction();

          const tempData = tempRecord.get({ plain: true });
          
          // Debug logging
          console.log('Processing record:', {
            id: tempData.id,
            final_remarks: tempData.final_remarks,
            list_contacts_id: tempData.list_contacts_id
          });

          // Check if both fields have valid values
          const hasValidFinalRemarks = tempData.final_remarks && 
                                     tempData.final_remarks.trim() !== '';
          const hasValidContactsId = tempData.list_contacts_id && 
                                    tempData.list_contacts_id.trim() !== '';
          const shouldMarkCompleted = hasValidFinalRemarks && hasValidContactsId;

          // Prepare update data for main table
          const updateData = {
            full_name: tempData.full_name,
            head_title: tempData.head_title,
            head_location: tempData.head_location,
            title_1: tempData.title_1,
            company_1: tempData.company_1,
            company_link_1: tempData.company_link_1,
            exp_duration: tempData.exp_duration,
            exp_location: tempData.exp_location,
            job_type: tempData.job_type,
            title_2: tempData.title_2,
            company_2: tempData.company_2,
            company_link_2: tempData.company_link_2,
            exp_duration_2: tempData.exp_duration_2,
            exp_location_2: tempData.exp_location_2,
            job_type_2: tempData.job_type_2,
            final_remarks: tempData.final_remarks,
            list_contacts_id: tempData.list_contacts_id,
            url_id: tempData.url_id,
            last_sync: new Date()
          };

          // Update status if conditions are met
          if (shouldMarkCompleted) {
            updateData.status = 'Completed';
          }

          // Update main table
          const [updated] = await VerificationUpload.update(updateData, {
            where: { 
              uniqueId: tempData.uniqueId,
              link_id: tempData.link_id
            },
            transaction
          });

          if (updated > 0) {
            processedCount++;
            
            // If marked as completed, delete from temp table
            if (shouldMarkCompleted) {
              await VerificationTemp.destroy({
                where: { id: tempData.id },
                transaction
              });
              markedCompletedCount++;
              deletedCount++;
              console.log(`✓ Marked as completed and deleted temp record ${tempData.id}`);
            }
          } else {
            skippedCount++;
            console.log(`⚠️ No matching record found for link_id: ${tempData.link_id}`);
          }

          await transaction.commit();
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (recordError) {
          // if (transaction) await transaction.rollback();
          console.error(`⚠️ Error processing record ${tempRecord.id}:`, recordError.message);
          continue;
        }
      }

      offset += batchSize;
    }

    await checkAndUpdateEmailStatus1()

    console.log(`✅ Sync completed successfully. Stats:
      - Processed: ${processedCount}
      - Marked as completed: ${markedCompletedCount}
      - Deleted: ${deletedCount}
      - Skipped: ${skippedCount}
    `);

  } catch (jobError) {
    console.error('❌ Error in sync job:', jobError);
  }
});

console.log('⏰ VerificationTemp sync job scheduled to run every 3 minutes');



async function checkAndUpdateEmailStatus1() {
  console.log('⏳ Cron Job: Checking matchLink status...');

  try {
    // Step 1: Get all uniqueIds in emailsent with pending status
    const pendingUniqueIds = await emailsent1.findAll({
      where: { status: 'pending' },
      attributes: ['uniqueId'],
      group: ['uniqueId']
    });

    for (const record of pendingUniqueIds) {
      const uniqueId = record.uniqueId;

      // Step 2: Get all Link rows for this uniqueId where matchLink is not null
      const matchedLinks = await VerificationUpload.findAll({
        where: {
          uniqueId,
          clean_link: { [Op.ne]: null }
        },
        attributes: ['status']
      });

      if (matchedLinks.length === 0) {
        console.log(`⚠️ No cleanlink found for ${uniqueId}, skipping...`);
        continue;
      }

      // Step 3: Check if all matched links are pending or completed
      const hasPending = matchedLinks.every(link => link.status === 'pending');
      const hasCompleted = matchedLinks.every(link => link.status === 'Completed');

      if (hasPending) {
        console.log(`⏳ ${uniqueId} still has pending matchLink rows, skipping completion...`);
        continue;
      }

      if (hasCompleted) {
        // Step 4: If none are pending, update emailsent status to completed
        await emailsent1.update(
          { status: 'completed' },
          { where: { uniqueId } }
        );
        await VerificationUpload.update(
          { final_status: 'Completed' },
          { where: { uniqueId } }
        );

        console.log(`✅ ${uniqueId} marked as completed in emailsent`);

        // Step 5: Get email address for this uniqueId
        const emailRecord = await emailsent1.findOne({
          where: { uniqueId },
          attributes: ['email']
        });

        if (!emailRecord || !emailRecord.email) {
          console.log(`⚠️ No savedEmail found for ${uniqueId}, skipping email sending...`);
          continue;
        }

        const email = emailRecord.email;

        // Step 6: Send the email
        try {
          const mailOptions = {
            from: '"B2B LinkedIn Verification System" <b2bdirectdata@gmail.com>',
            to: email,
            subject: `B2B LinkedIn Verification System Completed - ${uniqueId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">B2B LinkedIn Verification System Completed</h2>
                <p>All Verification processes for ${uniqueId} have been completed.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">LinkedIn Verification System</h3>
                  <p><strong>File UniqueId:</strong> ${uniqueId}</p>
                </div>
                
                <p>All results are now available for download.</p>
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`📧 Completion email sent to ${email} for ${uniqueId}`);
        } catch (err) {
          console.error(`❌ Failed to send email for ${uniqueId}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in cron job:', error);
  }
}



cron.schedule('*/5 * * * *', async () => {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile1: true,
        processingStartTime1: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000) // older than 5 mins
        }
      }
    });
    
    for (const user of staleUsers) {
      await user.update({ isProcessingFile1: false, processingStartTime1: null });
      
      
    }
  } catch (error) {
    console.error('Error in processing cleanup job:', error);
  }
});



// // Download endpoint with merged data
// app.get('/download-verification-data/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     // Get data from both tables
//     const [mainRecords, tempRecords] = await Promise.all([
//       VerificationUpload.findAll({ where: { uniqueId } }),
//       VerificationTemp.findAll({ where: { uniqueId } })
//     ]);

//     // Merge data - prioritize temp records but fall back to main records
//     const mergedData = mainRecords.map(mainRecord => {
//       const tempRecord = tempRecords.find(t => 
//         t.clean_linkedin_link === mainRecord.clean_link ||
//         t.clean_linkedin_link.replace('/details/experience/', '') === mainRecord.link
//       );
      
//       return {
//         // From main table
//         id: mainRecord.id,
//         uniqueId: mainRecord.uniqueId,
//         email: mainRecord.email,
//         link: mainRecord.link,
//         fileName: mainRecord.fileName,
//         creditsUsed: mainRecord.creditsUsed,
//         status: mainRecord.status,
//         date: mainRecord.date,
        
//         // From temp table (if available) or main table
//         full_name: tempRecord?.full_name || mainRecord.full_name,
//         head_title: tempRecord?.head_title || mainRecord.head_title,
//         head_location: tempRecord?.head_location || mainRecord.head_location,
//         title_1: tempRecord?.title_1 || mainRecord.title_1,
//         company_1: tempRecord?.company_1 || mainRecord.company_1,
//         company_link_1: tempRecord?.company_link_1 || mainRecord.company_link_1,
//         exp_duration: tempRecord?.exp_duration || mainRecord.exp_duration,
//         exp_location: tempRecord?.exp_location || mainRecord.exp_location,
//         job_type: tempRecord?.job_type || mainRecord.job_type,
//         title_2: tempRecord?.title_2 || mainRecord.title_2,
//         company_2: tempRecord?.company_2 || mainRecord.company_2,
//         company_link_2: tempRecord?.company_link_2 || mainRecord.company_link_2,
//         exp_duration_2: tempRecord?.exp_duration_2 || mainRecord.exp_duration_2,
//         exp_location_2: tempRecord?.exp_location_2 || mainRecord.exp_location_2,
//         job_type_2: tempRecord?.job_type_2 || mainRecord.job_type_2,
//         final_remarks: tempRecord?.final_remarks || mainRecord.final_remarks,
//         list_contacts_id: tempRecord?.list_contacts_id || mainRecord.list_contacts_id,
//         url_id: tempRecord?.url_id || mainRecord.url_id,
//         clean_link: tempRecord?.clean_linkedin_link || mainRecord.clean_link,
//         remark: tempRecord?.remark || mainRecord.remark,
        
//         // Sync info
//         last_sync: mainRecord.last_sync || 'Not synced'
//       };
//     });

//     // Create Excel file
//     const worksheet = XLSX.utils.json_to_sheet(mergedData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "VerificationData");
    
//     // Generate filename
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const fileName = `VerificationData_${uniqueId}_${timestamp}.xlsx`;
//     const filePath = path.join(__dirname, 'downloads', fileName);
    
//     // Ensure downloads directory exists
//     if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
//       fs.mkdirSync(path.join(__dirname, 'downloads'));
//     }
    
//     // Save file
//     XLSX.writeFile(workbook, filePath);
    
//     // Send file
//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         console.error('Download error:', err);
//       }
//       // Clean up file after download
//       fs.unlinkSync(filePath);
//     });

//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate download',
//       details: error.message
//     });
//   }
// });


// // Scheduled sync job
// function setupScheduledSync() {
//   cron.schedule('*/3 * * * *', async () => {
//     try {
//       console.log('Running scheduled sync from temp to main table...');
      
//       const uniqueIds = await VerificationTemp.findAll({
//         attributes: ['uniqueId'],
//         group: ['uniqueId'],
//         raw: true
//       });

//       for (const { uniqueId } of uniqueIds) {
//         try {
//           const response = await axios.post(
//             `${process.env.VITE_API_BASE_URL}/sync-temp-to-main/${uniqueId}`
//           );
//           console.log(`Sync completed for ${uniqueId}:`, response.data);
//         } catch (err) {
//           console.error(`Error syncing ${uniqueId}:`, err.message);
//         }
//       }
//     } catch (error) {
//       console.error('Scheduled job error:', error);
//     }
//   });

//   console.log('Scheduled sync job initialized');
// }

// setupScheduledSync();


// Add this route for deducting credits
// In your backend route file (e.g., routes/api.js)

app.post('/api/deduct-credits', async (req, res) => {
  try {
    const { userEmail, credits, uniqueId } = req.body;

    if (!userEmail || !credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credit deduction request' });
    }

    const user = await User.findOne({ where: { userEmail } });


    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.credits < 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    user.credits -= credits;
    await user.save();

    // Optional: Save in CreditHistory table for audit
    await CreditHistory.create({
      email: userEmail,
      creditsUsed: credits,
      
      uniqueId
    });

    res.json({ updatedCredits: user.credits });

  } catch (err) {
    console.error('Credit deduction error:', err);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});







/////////////////////verfication company////////////

const VerificationUpload_com = require('./model/verification_upload_com');
const VerificationTemp_com = require('./model/verification_temp_com');


app.post('/upload-excel-verification-com',auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });


    // Get credit information from headers
    const creditCost = parseFloat(req.headers['credit-cost']);
    const userCredits = parseFloat(req.headers['user-credits']);

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const links = rows.flat().filter(cell =>
      typeof cell === 'string' &&
      cell.toLowerCase().includes('linkedin.com')
    );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'No LinkedIn links found.' });
    }

     // Check if user has enough credits
    const requiredCredits = creditCost * links.length;
    if (userCredits < requiredCredits) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: `Insufficient credits. You need ${requiredCredits} but only have ${userCredits}` 
      });
    }

     // For any number of links (less than or equal to 1000), require confirmation
    if (links.length < 10000) {
      return res.status(200).json({ 
        message: "Confirmation required to proceed", 
        linkCount: links.length,
        requiresConfirmation: true,
        fileName: req.file.originalname
      });
    }


    if (links.length > 10000) {
       fs.unlinkSync(filePath);
  return res.status(400).json({ message: "Max 10 links allowed" });
}

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});


// app.post('/con-upload-excel-verification-com',auth, upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

//  // Set processing status to true at the start
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );


//      // Initialize variables
//     let uniqueId, links = [];
//     const processCredits = req.body.processCredits === 'true';
//     const BATCH_SIZE = 300;


// if (req.file) {
//       const filePath = req.file.path;
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  

//      links = rows.flat().filter(cell =>
//       typeof cell === 'string' &&
//       cell.toLowerCase().includes('linkedin.com')
//     );

//     if (links.length === 0) {
//        fs.unlinkSync(filePath);
//         await setProcessingFalse1(email);
//       return res.status(400).json({ message: 'No LinkedIn links found.' });
//     }

//        if (links.length > 10000) {
//       fs.unlinkSync(filePath);
//         await setProcessingFalse1(email);
//   return res.status(400).json({ message: "Max 10 links allowed" });
// }

//      uniqueId = uuidv4();
//     let pendingCount = 0;

//     const categorizedLinks = links.map(link => {
//       let remark;
//       let clean_link = link;
      
//       // First check for company links and clean them
//       if (/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)/i.test(link)) {
//         remark = 'pending'; // Changed from 'Company Link' to 'pending'
//         pendingCount++;
//         // Clean company link according to the provided logic
//         const companySlug = link.match(/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)\/([^/?#]+)/i)?.[2] || 'unknown-company';
//         clean_link = `https://www.linkedin.com/company/${companySlug}/about`;
//       } 
//       // Then check for Sales Navigator links
//       else if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } 
//       else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
//         remark = 'Sales Navigator Link';
//       } 
//       // Check for old pub links
//       else if (/linkedin\.com\/pub\//i.test(link)) {
//         remark = "This page doesn't exist";
//       } 
//       // Check for invalid profile links
//       else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
//         remark = 'Invalid Profile Link';
//       } 
//       // Check for junk links (no /in/)
//       else if (!/linkedin\.com\/in\//i.test(link)) {
//         remark = 'Junk Link';
//       } 
//       // Everything else is pending
//       else {
//         remark = "invalid company";
//       }

//       return {
//         uniqueId,
//         email,
//         link,
//         totallink: links.length,
//         clean_link,
//         remark,
//         fileName: req.file.originalname,
//         pendingCount,
        
//       };
//     });

   
//       // Save to database in batches
//       for (let i = 0; i < categorizedLinks.length; i += BATCH_SIZE) {
//         const batch = categorizedLinks.slice(i, i + BATCH_SIZE);
//         await VerificationUpload_com.bulkCreate(batch);
//       }
      
//       fs.unlinkSync(filePath);


//        // Step 2: Process pending links if processCredits is true
//     if (processCredits && pendingCount > 0) {
//       // First check if user has enough credits
//       const user = await User.findOne({ where: { userEmail: email } });

//        const creditsToDeduct = pendingCount * user.creditCostPerLink_C;
//       if (!user) {
//         await VerificationUpload_com.destroy({ where: { uniqueId } });
//         await setProcessingStatus2(email, false);
//         return res.status(404).json({ message: 'User not found' });
//       }

//       if (user.credits < creditsToDeduct) {
//         await VerificationUpload_com.destroy({ where: { uniqueId } });
//         await setProcessingStatus2(email, false);
//         return res.status(400).json({ 
//           message: 'Insufficient credits',
//           requiredCredits: creditsToDeduct,
//           currentCredits: user.credits
//         });
//       }
//        // Deduct credits after successful processing
//       user.credits = user.credits - creditsToDeduct; // Ensure we don't get NaN
//       await user.save();

//       // Update all VerificationUpload records with credits info
//       await VerificationUpload_com.update(
//         { 
//           creditsUsed: creditsToDeduct,
//           remainingCredits: user.credits 
//         },
//         { where: { uniqueId } }
//       );
// // Get pending links for this batch
//     const pendingLinks = await VerificationUpload_com.findAll({
//       where: { uniqueId, email, remark: 'pending' }
//     });

//      let insertedCount = 0;
//       let updatedCount = 0;
    

//     // Process each link
//     for (const linkRecord of pendingLinks) {
//       // Update verification_upload table
//       await VerificationUpload_com.update(
//         { clean_link: linkRecord.clean_link },
//         { where: { id: linkRecord.id } }
//       );
//        updatedCount++;

//       // Insert into verification_temp table
//       await VerificationTemp_com.create({
//         uniqueId,
//         clean_linkedin_link: linkRecord.clean_link,
//         link_id: linkRecord.link_id,
//         remark: 'pending',
//        company_name:linkRecord.company_name,
//       company_url: linkRecord.company_url || null,
//       company_headquater: linkRecord.company_headquater || null,
//       company_industry: linkRecord.company_industry || null,
//       company_size: linkRecord.company_size || null,
//       employee_count: linkRecord.employee_count || null,
//       year_founded: linkRecord.year_founded || null,
//       company_speciality: linkRecord.company_speciality || null,
//       linkedin_url: linkRecord.linkedin_url || null,
//       company_stock_name: linkRecord.company_stock_name || null,
//       verified_page_date: linkRecord.verified_page_date || null,
//       phone_number: linkRecord.phone_number || null,
//       company_followers: linkRecord.company_followers || null,
//       location_total: linkRecord.location_total || null,
//       overview: linkRecord.overview || null,
//       visit_website: linkRecord.visit_website || null,
//       final_remarks: linkRecord.final_remarks || null,
//       company_id: linkRecord.company_id || null
//       });

//       insertedCount++;
//     }


   

      

//       await setProcessingStatus2(email, false);



//     return res.json({
//         message: 'File processed, links matched, and credits deducted successfully',
//         uniqueId,
//         fileName: req.file.originalname,
//         totalLinks: links.length,
//         pendingCount,
//         insertedCount,
//         updatedCount,
//         creditsDeducted: creditsToDeduct,
//         updatedCredits: user.credits,
//         categorizedLinks: categorizedLinks.map(l => ({
//           link: l.link,
//           remark: l.remark
//         })),
//         date: new Date().toISOString(),
//         status: 'complete'
//       });
//     }

//     await setProcessingStatus2(email, false);
//     return res.json({
//       message: 'Links categorized successfully',
//       uniqueId,
//       fileName: req.file.originalname,
//       totalLinks: links.length,
//       pendingCount,
//       creditsRequired: pendingCount * creditCost,
//       categorizedLinks: categorizedLinks.map(l => ({
//         link: l.link,
//         remark: l.remark
//       })),
//       date: new Date().toISOString(),
//       nextStep: processCredits ? 'complete' : 'confirm',
//       status: 'categorized'
//     });

//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) {
//       try {
//         if (fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }
//       } catch (unlinkErr) {
//         console.error('Error deleting file:', unlinkErr);
//       }
//     }
//     await setProcessingStatus2(email, false);
  
//   }
// });




// app.post('/con-upload-excel-verification-com', auth, upload.single('file'), async (req, res) => {
//   try {
//     const email = req.headers['user-email'];
//     if (!email) return res.status(400).json({ error: "Email required" });

//     // Set processing status to true at the start
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: true }
//     );

//     // Initialize variables
//     let uniqueId, links = [];
//     const processCredits = req.body.processCredits === 'true';
//     const BATCH_SIZE = 300;

//     if (req.file) {
//       const filePath = req.file.path;
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//       // Extract and filter LinkedIn links
//       links = rows.flat().filter(cell => 
//         typeof cell === 'string' && 
//         cell.toLowerCase().includes('linkedin.com')
//       );

//       if (links.length === 0) {
//         fs.unlinkSync(filePath);
//         await setProcessingFalse2(email);
//         return res.status(400).json({ message: 'No LinkedIn links found.' });
//       }

//       if (links.length > 10000) {
//         fs.unlinkSync(filePath);
//         await setProcessingFalse2(email);
//         return res.status(400).json({ message: "Max 10,000 links allowed" });
//       }

//       uniqueId = uuidv4();
//       let pendingCount = 0;

//       // First pass: Categorize all links
//       const categorizedLinks = links.map(link => {
//         let remark;
//         let clean_link = link;
        
//         if (/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)/i.test(link)) {
//           remark = 'pending';
//           pendingCount++;
//           const companySlug = link.match(/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)\/([^/?#]+)/i)?.[2] || 'unknown-company';
//           clean_link = `https://www.linkedin.com/company/${companySlug}/about`;
//         } 
//         else if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link) ||
//                  /linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
//           remark = 'Sales Navigator Link';
//         } 
//         else if (/linkedin\.com\/pub\//i.test(link)) {
//           remark = "This page doesn't exist";
//         } 
//         else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
//           remark = 'Invalid Profile Link';
//         } 
//         else if (!/linkedin\.com\/in\//i.test(link)) {
//           remark = 'Junk Link';
//         } 
//         else {
//           remark = "invalid company";
//         }

//         return {
//           uniqueId,
//           email,
//           link,
//           totallink: links.length,
//           clean_link,
//           remark,
//           fileName: req.file.originalname,
//           pendingCount
//         };
//       });

//       // Save to database in batches
//       for (let i = 0; i < categorizedLinks.length; i += BATCH_SIZE) {
//         const batch = categorizedLinks.slice(i, i + BATCH_SIZE);
//         await VerificationUpload_com.bulkCreate(batch);
//       }
      
//       fs.unlinkSync(filePath);

//       // If there are pending links, process them
//       if (pendingCount > 0) {
//         let offset = 0;
//         let insertedCount = 0;
//         let updatedCount = 0;

//         while (true) {
//           const batch = await VerificationUpload_com.findAll({
//             where: { uniqueId, email, remark: 'pending' },
//             limit: BATCH_SIZE,
//             offset: offset,
//             order: [['id', 'ASC']]
//           });

//           if (batch.length === 0) break;

//           // Process batch
//           const updatePromises = [];
//           const insertPromises = [];

//           for (const linkRecord of batch) {
//             if (linkRecord.clean_link) {
//               updatePromises.push(
//                 VerificationUpload_com.update(
//                   { clean_link: linkRecord.clean_link },
//                   { where: { id: linkRecord.id } }
//                 )
//               );

//               insertPromises.push(
//                 VerificationTemp_com.create({
//                   uniqueId,
//                   clean_linkedin_link: linkRecord.clean_link,
//                   link_id: linkRecord.link_id,
//                   remark: 'pending',
//                   company_name: linkRecord.company_name,
//                   company_url: linkRecord.company_url || null,
//                   company_headquater: linkRecord.company_headquater || null,
//                   company_industry: linkRecord.company_industry || null,
//                   company_size: linkRecord.company_size || null,
//                   employee_count: linkRecord.employee_count || null,
//                   year_founded: linkRecord.year_founded || null,
//                   company_speciality: linkRecord.company_speciality || null,
//                   linkedin_url: linkRecord.linkedin_url || null,
//                   company_stock_name: linkRecord.company_stock_name || null,
//                   verified_page_date: linkRecord.verified_page_date || null,
//                   phone_number: linkRecord.phone_number || null,
//                   company_followers: linkRecord.company_followers || null,
//                   location_total: linkRecord.location_total || null,
//                   overview: linkRecord.overview || null,
//                   visit_website: linkRecord.visit_website || null,
//                   final_remarks: linkRecord.final_remarks || null,
//                   company_id: linkRecord.company_id || null
//                 })
//               );
//             }
//           }

//           await Promise.all(updatePromises);
//           await Promise.all(insertPromises);

//           insertedCount += insertPromises.length;
//           updatedCount += updatePromises.length;
//           offset += BATCH_SIZE;
//         }

//         // Process credits if requested
//         if (processCredits) {
//           const user = await User.findOne({ where: { userEmail: email } });
//           if (!user) {
//             await VerificationUpload_com.destroy({ where: { uniqueId } });
//             await setProcessingFalse2(email);
//             return res.status(404).json({ message: 'User not found' });
//           }

//           const creditsToDeduct = pendingCount * user.creditCostPerLink_C;
//           if (user.credits < creditsToDeduct) {
//             await VerificationUpload_com.destroy({ where: { uniqueId } });
//             await setProcessingFalse2(email);
//             return res.status(400).json({ 
//               message: 'Insufficient credits',
//               requiredCredits: creditsToDeduct,
//               currentCredits: user.credits
//             });
//           }

//           // Update records with credit info
//           await VerificationUpload_com.update(
//             { 
//               creditsUsed: creditsToDeduct,
//               remainingCredits: user.credits - creditsToDeduct
//             },
//             { where: { uniqueId } }
//           );

//           // Deduct credits
//           user.credits -= creditsToDeduct;
//           await user.save();

//           // Send completion email
//           try {
//             const mailOptions = {
//               from: "your-email@example.com",
//               to: email,
//               subject: 'Company Verification - Processing Complete',
//               html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                   <h2 style="color: #2563eb;">Company Verification Complete</h2>
//                   <p>Your file has been processed successfully.</p>
                  
//                   <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
//                     <h3 style="margin-top: 0; color: #1f2937;">Processing Details</h3>
//                     <p><strong>File Name:</strong> ${req.file.originalname}</p>
//                     <p><strong>Total Links:</strong> ${links.length}</p>
//                     <p><strong>Pending Links Processed:</strong> ${pendingCount}</p>
//                     <p><strong>Credits Deducted:</strong> ${creditsToDeduct}</p>
//                   </div>
                  
//                   <p>The verification results are now available in your dashboard.</p>
//                 </div>
//               `
//             };
//             transporter.sendMail(mailOptions).catch(console.error);
//           } catch (emailError) {
//             console.error('Email failed:', emailError);
//           }

//           return res.json({
//             message: 'Processing completed successfully',
//             uniqueId,
//             fileName: req.file.originalname,
//             totalLinks: links.length,
//             pendingCount,
//             creditsDeducted: creditsToDeduct,
//             remainingCredits: user.credits,
//             date: new Date().toISOString()
//           });
//         }

//         return res.json({
//           message: 'Links processed successfully (credits not deducted)',
//           uniqueId,
//           fileName: req.file.originalname,
//           totalLinks: links.length,
//           pendingCount,
//           date: new Date().toISOString(),
//           nextStep: 'confirm-credits'
//         });
//       }

//       return res.json({
//         message: 'Links categorized successfully (no pending links to process)',
//         uniqueId,
//         fileName: req.file.originalname,
//         totalLinks: links.length,
//         date: new Date().toISOString()
//       });
//     }

//   } catch (err) {
//     console.error('Upload error:', err);
//     if (req.file?.path) fs.unlinkSync(req.file.path);
    
//     // Cleanup any created records if we have a uniqueId
//     if (uniqueId) {
//       try {
//         await VerificationUpload_com.destroy({ where: { uniqueId } });
//       } catch (cleanupError) {
//         console.error('Cleanup failed:', cleanupError);
//       }
//     }
    
//     await setProcessingFalse2(email);
//     res.status(500).json({ 
//       error: 'Upload failed', 
//       details: err.message 
//     });
//   }
// });

// // Helper function to set processing status to false
// async function setProcessingFalse2(email) {
//   try {
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing`,
//       { userEmail: email, isProcessing: false }
//     );
//   } catch (err) {
//     console.error('Error setting processing status to false:', err);
//   }
// }


app.post('/con-upload-excel-verification-com', auth, upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

    // Set processing status to true at the start
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing2`,
      { userEmail: email, isProcessing: true }
    );

    // Initialize variables
    let uniqueId, links = [];
    const processCredits = req.body.processCredits === 'true';
    const BATCH_SIZE = 200;

    if (req.file) {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      // Extract and filter LinkedIn links
      links = rows.flat().filter(cell => 
        typeof cell === 'string' && 
        cell.toLowerCase().includes('linkedin.com')
      );

      if (links.length === 0) {
        fs.unlinkSync(filePath);
        await setProcessingFalse3(email);
        return res.status(400).json({ message: 'No LinkedIn links found.' });
      }

      if (links.length > 5000) {
        fs.unlinkSync(filePath);
        await setProcessingFalse3(email);
        return res.status(400).json({ message: "Max 5,000 links allowed" });
      }

      uniqueId = uuidv4();
      let pendingCount = 0;

      // First pass: Process all links individually (no bulkCreate)
      for (const link of links) {
        let remark;
        let clean_link = link;
        
        if (/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)/i.test(link)) {
          remark = 'pending';
          pendingCount++;
          const companySlug = link.match(/linkedin\.com\/(company|school|organizations|showcase|sales\/company|talent\/company)\/([^/?#]+)/i)?.[2] || 'unknown-company';
          clean_link = `https://www.linkedin.com/company/${companySlug}/about`;
        } 
        else if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link) ||
                 /linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
          remark = 'Sales Navigator Link';
        } 
        else if (/linkedin\.com\/pub\//i.test(link)) {
          remark = "This page doesn't exist";
        } 
        else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
          remark = 'Invalid Profile Link';
        } 
        else if (!/linkedin\.com\/in\//i.test(link)) {
          remark = 'Junk Link';
        } 
        else {
          remark = "invalid company";
        }

        // Create record individually
        await VerificationUpload_com.create({
          uniqueId,
          email,
          link,
          totallink: links.length,
          clean_link,
          remark,
          fileName: req.file.originalname,
          pendingCount
        });
      }

        await emailsent2.create({
          uniqueId,
          email
     });

      
      fs.unlinkSync(filePath);

      // If there are pending links, process them
      if (pendingCount > 0) {
        let offset = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        while (true) {
          const batch = await VerificationUpload_com.findAll({
            where: { uniqueId, email, remark: 'pending' },
            limit: BATCH_SIZE,
            offset: offset,
            order: [['id', 'ASC']]
          });

          if (batch.length === 0) break;

          for (const linkRecord of batch) {
            if (linkRecord.clean_link) {
              // Update verification_upload table
              await VerificationUpload_com.update(
                { clean_link: linkRecord.clean_link },
                { where: { id: linkRecord.id } }
              );
              updatedCount++;

              // Insert into verification_temp table
              await VerificationTemp_com.create({
                uniqueId,
                clean_linkedin_link: linkRecord.clean_link,
                link_id: linkRecord.link_id,
                remark: 'pending',
                company_name: linkRecord.company_name,
                company_url: linkRecord.company_url || null,
                company_headquater: linkRecord.company_headquater || null,
                company_industry: linkRecord.company_industry || null,
                company_size: linkRecord.company_size || null,
                employee_count: linkRecord.employee_count || null,
                year_founded: linkRecord.year_founded || null,
                company_speciality: linkRecord.company_speciality || null,
                linkedin_url: linkRecord.linkedin_url || null,
                company_stock_name: linkRecord.company_stock_name || null,
                verified_page_date: linkRecord.verified_page_date || null,
                phone_number: linkRecord.phone_number || null,
                company_followers: linkRecord.company_followers || null,
                location_total: linkRecord.location_total || null,
                overview: linkRecord.overview || null,
                visit_website: linkRecord.visit_website || null,
                final_remarks: linkRecord.final_remarks || null,
                company_id: linkRecord.company_id || null
              });
              insertedCount++;
            }
          }

          offset += BATCH_SIZE;
        }

        // Process credits if requested
        if (processCredits) {
          const user = await User.findOne({ where: { userEmail: email } });
          if (!user) {
            await VerificationUpload_com.destroy({ where: { uniqueId } });
            await setProcessingFalse3(email);
            return res.status(404).json({ message: 'User not found' });
          }

          const creditsToDeduct = pendingCount * user.creditCostPerLink_C;
          if (user.credits < creditsToDeduct) {
            await VerificationUpload_com.destroy({ where: { uniqueId } });
            await setProcessingFalse3(email);
            return res.status(400).json({ 
              message: 'Insufficient credits',
              requiredCredits: creditsToDeduct,
              currentCredits: user.credits
            });
          }

          // Update records with credit info
          await VerificationUpload_com.update(
            { 
              creditsUsed: creditsToDeduct,
              remainingCredits: user.credits - creditsToDeduct
            },
            { where: { uniqueId } }
          );

          // Deduct credits
          user.credits -= creditsToDeduct;
          await user.save();

          await setProcessingFalse2(email);

          // Send completion email
          try {
            const mailOptions = {
              from: "b2bdirectdata@gmail.com",
              to: email,
              subject: 'Company Verification - Processing',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Company Verification - Processing </h2>
                 
                  
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Processing Details</h3>
                    <p><strong>File Name:</strong> ${req.file.originalname}</p>
                    <p><strong>Total Links:</strong> ${links.length}</p>
                    <p><strong>Pending Links Processed:</strong> ${pendingCount}</p>
                    <p><strong>Credits Deducted:</strong> ${creditsToDeduct}</p>
                  </div>
                  
                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
              `
            };
            transporter.sendMail(mailOptions).catch(console.error);
          } catch (emailError) {
            console.error('Email failed:', emailError);
          }

          return res.json({
            message: 'Processing completed successfully',
            uniqueId,
            fileName: req.file.originalname,
            totalLinks: links.length,
            pendingCount,
            creditsDeducted: creditsToDeduct,
            remainingCredits: user.credits,
            date: new Date().toISOString()
          });
        }

        return res.json({
          message: 'Links processed successfully (credits not deducted)',
          uniqueId,
          fileName: req.file.originalname,
          totalLinks: links.length,
          pendingCount,
          date: new Date().toISOString(),
          nextStep: 'confirm-credits'
        });
      }

      return res.json({
        message: 'Links categorized successfully (no pending links to process)',
        uniqueId,
        fileName: req.file.originalname,
        totalLinks: links.length,
        date: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    
 
    
    await setProcessingFalse3(email);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message 
    });
  }
});

// Helper function to set processing status to false
async function setProcessingFalse3(email) {
  try {
    await axios.post(
      `${process.env.VITE_API_BASE_URL}/api/set-file-processing2`,
      { userEmail: email, isProcessing: false }
    );
  } catch (err) {
    console.error('Error setting processing status to false:', err);
  }
}
// // Helper functions
// async function setProcessingStatus2(email, isProcessing) {
//   try {
//     await axios.post(
//       `${process.env.VITE_API_BASE_URL}/api/set-file-processing2`,
//       { userEmail: email, isProcessing }
//     );
//   } catch (error) {
//     console.error('Error setting processing status:', error);
//   }
// }





// Check file processing status
app.get('/api/check-file-processing2',auth, async (req, res) => {
  try {
    const { userEmail } = req.query;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isProcessingFile2 === true){
  
        return res.status(404).json({ message: 'File is currently being processed' });
    }

    res.json({ isProcessing: user.isProcessingFile2 });
  } catch (error) {
    console.error('Error checking file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// In your set-file-processing endpoint
app.post('/api/set-file-processing2', async (req, res) => {
  try {
    const { userEmail, isProcessing } = req.body;
    const user = await User.findOne({ where: { userEmail } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      isProcessingFile2: isProcessing,
      processingStartTime2: isProcessing ? new Date() : null
    };

    await user.update(updateData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting file processing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// app.post('/process-matching-com/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
//     const email = req.headers['user-email'];

//     if (!email) return res.status(400).json({ error: "Email required" });

//     // Get pending links for this batch
//     const pendingLinks = await VerificationUpload_com.findAll({
//       where: { uniqueId, email, remark: 'pending' }
//     });

//     let processedCount = 0;

//     // Process each link
//     for (const linkRecord of pendingLinks) {
//       // Update verification_upload table
//       await VerificationUpload_com.update(
//         { clean_link: linkRecord.clean_link },
//         { where: { id: linkRecord.id } }
//       );

//       // Insert into verification_temp table
//       await VerificationTemp_com.create({
//         uniqueId,
//         clean_linkedin_link: linkRecord.clean_link,
//         link_id: linkRecord.link_id,
//         remark: 'pending',
//        company_name:linkRecord.company_name,
//       company_url: linkRecord.company_url || null,
//       company_headquater: linkRecord.company_headquater || null,
//       company_industry: linkRecord.company_industry || null,
//       company_size: linkRecord.company_size || null,
//       employee_count: linkRecord.employee_count || null,
//       year_founded: linkRecord.year_founded || null,
//       company_speciality: linkRecord.company_speciality || null,
//       linkedin_url: linkRecord.linkedin_url || null,
//       company_stock_name: linkRecord.company_stock_name || null,
//       verified_page_date: linkRecord.verified_page_date || null,
//       phone_number: linkRecord.phone_number || null,
//       company_followers: linkRecord.company_followers || null,
//       location_total: linkRecord.location_total || null,
//       overview: linkRecord.overview || null,
//       visit_website: linkRecord.visit_website || null,
//       final_remarks: linkRecord.final_remarks || null,
//       company_id: linkRecord.company_id || null
//       });

//       processedCount++;
//     }

//     res.json({
//       message: 'Processed and updated links successfully',
//       uniqueId,
//       processedCount,
//       totalPending: pendingLinks.length
//     });

//   } catch (err) {
//     console.error('Processing error:', err);
//     res.status(500).json({ 
//       error: 'Processing failed', 
//       details: err.message
//     });
//   }
// });



app.get('/get-verification-links-com',auth, async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    
    if (!userEmail || userEmail === 'Guest') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Fetch all verification uploads for this user
    const uploads = await VerificationUpload_com.findAll({
      where: { email: userEmail },
      order: [['id', 'DESC']] // Newest first
    });

    if (!uploads || uploads.length === 0) {
      return res.status(200).json([]);
    }

    // Group by uniqueId and transform data
    const result = uploads.reduce((acc, upload) => {
      const existingGroup = acc.find(g => g.uniqueId === upload.uniqueId);
      const linkData = {
        id: upload.id,
        link: upload.link,
        clean_link: upload.clean_link,
        remark: upload.remark || 'pending',
        
        date: upload.date
      };

      if (existingGroup) {
        existingGroup.links.push(linkData);
        existingGroup.totalLinks += 1;
        if (upload.remark === 'pending') existingGroup.pendingCount += 1;
        if (upload.matchLink) existingGroup.matchCount += 1;
      } else {
        acc.push({
          uniqueId: upload.uniqueId,
          fileName: upload.fileName,
          date: upload.date,
          totalLinks: 1,
          pendingCount: upload.remark === 'pending' ? 1 : 0,
          matchCount: upload.matchLink ? 1 : 0,
         creditsUsed: upload.creditsUsed,
          status: upload.remark === 'pending' ? 'pending' : 'completed',
          links: [linkData]
        });
      }
      return acc;
    }, []);

    // Calculate totals and status for each group
    result.forEach(group => {
      group.creditDeducted = group.matchCount * 2;
      group.status = group.pendingCount > 0 ? 'pending' : 'completed';
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching verification links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/api/verification-uploads-com/:uniqueId',auth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    // Get all records for this uniqueId
    const records = await VerificationUpload_com.findAll({
      where: { uniqueId }
    });

    // Calculate group status (same logic as frontend)
    const getGroupStatus = (group) => {
      if (!group || group.length === 0) return "completed";
      
      const hasPending = group.some(item => 
        item.remark === 'pending' || 
        (!item.matchLink && item.remark !== 'invalid')
      );
      
      const allCompleted = group.every(item => 
        item.matchLink || 
        item.remark === 'invalid' || 
        item.remark === 'processed'
      );

      if (hasPending) return "pending";
      if (allCompleted) return "completed";
      return "incompleted";
    };

    const groupStatus = getGroupStatus(records);

    // Add status to each record
    const responseData = records.map(record => ({
      ...record.get({ plain: true }),
      groupStatus // Add the calculated group status
    }));

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





app.post('/api/deduct-credits_v-com',auth, async (req, res) => {
  try {
    const { userEmail, credits, uniqueId } = req.body;

    if (!userEmail || !credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credit deduction request' });
    }

    const user = await User.findOne({ where: { userEmail } });


    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.credits < 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    user.credits -= credits;
    await user.save();

     // Update all VerificationUpload records with this uniqueId to include the credits used
    await VerificationUpload_com.update(
      { creditsUsed: credits,
        remainingCredits: user.credits
       },
      { where: { uniqueId } }
    );

    res.json({ updatedCredits: user.credits });

  } catch (err) {
    console.error('Credit deduction error:', err);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});




// Add this to your backend routes (e.g., in your Express server)
app.delete('/api/delete-verification-uploads-com/:uniqueId',auth, async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    if (!uniqueId) {
      return res.status(400).json({ error: 'Unique ID is required' });
    }

    const result = await VerificationUpload_com.destroy({
      where: { uniqueId }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'No records found to delete' });
    }

    res.json({ 
      success: true,
      message: `Deleted ${result} verification uploads`
    });
  } catch (error) {
    console.error('Error deleting verification uploads:', error);
    res.status(500).json({ error: 'Failed to delete verification uploads' });
  }
});





// 


// Scheduled job to sync VerificationTemp_com to VerificationUpload_com
cron.schedule('*/3 * * * *', async () => {
  console.log('\n🔄 Starting VerificationTemp_com to VerificationUpload_com sync job...');
  const jobStartTime = new Date();

  try {
    // Verify database connection first
    await sequelize.authenticate();
    console.log('✓ Database connection verified');
    
    // Process records in batches to prevent memory issues
    const batchSize = 300;
    let offset = 0;
    let hasMoreRecords = true;
    
    // Statistics
    let processedCount = 0;
    let skippedCount = 0;
    let markedCompletedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;

    while (hasMoreRecords) {
      console.log(`\n🔍 Fetching batch starting at offset ${offset}...`);
      
      const tempRecords = await VerificationTemp_com.findAll({
        limit: batchSize,
        offset: offset,
       
      });

      if (tempRecords.length === 0) {
        hasMoreRecords = false;
        console.log('ℹ️ No more records to process');
        continue;
      }

      console.log(`🔄 Processing batch of ${tempRecords.length} records...`);
      
      // Process each record in the current batch
      for (const tempRecord of tempRecords) {
        let transaction;
        try {
          transaction = await sequelize.transaction();

          const tempData = tempRecord.get({ plain: true });
          
          console.log('Processing record:', {
            id: tempData.id,
            final_remarks: tempData.final_remarks,
            company_id: tempData.company_id
          });

          // Check validation conditions
          const hasValidFinalRemarks = tempData.final_remarks && 
                                     tempData.final_remarks.trim() !== '';
          const hasValidCompanyId = tempData.company_id && 
                                  tempData.company_id.trim() !== '';
          const shouldMarkCompleted = hasValidFinalRemarks && hasValidCompanyId;

          // Prepare update data
          const updateData = {
            company_name: tempData.company_name,
            company_url: tempData.company_url,
            company_headquater: tempData.company_headquater,
            company_industry: tempData.company_industry,
            company_size: tempData.company_size,
            employee_count: tempData.employee_count,
            year_founded: tempData.year_founded,
            company_speciality: tempData.company_speciality,
            linkedin_url: tempData.linkedin_url,
            company_stock_name: tempData.company_stock_name,
            verified_page_date: tempData.verified_page_date,
            phone_number: tempData.phone_number,
            company_followers: tempData.company_followers,
            location_total: tempData.location_total,
            overview: tempData.overview,
            visit_website: tempData.visit_website,
            final_remarks: tempData.final_remarks,
            company_id: tempData.company_id,
            last_sync: new Date()
          };

          // Update status if completed
          if (shouldMarkCompleted) {
            updateData.status = 'Completed';
            updateData.final_status = 'Completed';
          }

          // Update main table
          const [updated] = await VerificationUpload_com.update(updateData, {
            where: { 
              uniqueId: tempData.uniqueId,
              link_id: tempData.link_id
            },
            transaction
          });

          if (updated > 0) {
            processedCount++;
            console.log(`✓ Updated VerificationUpload_com for link_id: ${tempData.link_id}`);
            
            // Delete from temp table if completed
            if (shouldMarkCompleted) {
              await VerificationTemp_com.destroy({ 
                where: { id: tempData.id },
                transaction
              });
              markedCompletedCount++;
              deletedCount++;
              console.log(`🗑️ Deleted temp record ${tempData.id}`);
            }
          } else {
            skippedCount++;
            console.log(`⚠️ No matching record found for link_id: ${tempData.link_id}`);
          }

          await transaction.commit();
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (recordError) {
          errorCount++;
          // if (transaction) await transaction.rollback();
          console.error(`❌ Error processing record ${tempRecord.id}:`, recordError.message);
          continue;
        }
      }

      offset += batchSize;

       await checkAndUpdateEmailStatus2()
      
      // Brief pause between batches
      if (hasMoreRecords) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final statistics
    const jobDuration = (new Date() - jobStartTime) / 1000;
    console.log(`\n✅ Company sync completed in ${jobDuration.toFixed(2)} seconds. Statistics:
      - Processed: ${processedCount}
      - Marked as completed: ${markedCompletedCount}
      - Deleted temp records: ${deletedCount}
      - Skipped: ${skippedCount}
      - Errors: ${errorCount}
    `);

  } catch (jobError) {
    console.error('❌ Critical error in company sync job:', jobError);
  }
});

console.log('⏰ VerificationTemp_com sync job scheduled to run every 3 minutes');



async function checkAndUpdateEmailStatus2() {
  console.log('⏳ Cron Job: Checking matchLink status...');

  try {
    // Step 1: Get all uniqueIds in emailsent with pending status
    const pendingUniqueIds = await emailsent2.findAll({
      where: { status: 'pending' },
      attributes: ['uniqueId'],
      group: ['uniqueId']
    });

    for (const record of pendingUniqueIds) {
      const uniqueId = record.uniqueId;

      // Step 2: Get all Link rows for this uniqueId where matchLink is not null
      const matchedLinks = await VerificationUpload.findAll({
        where: {
          uniqueId,
          clean_link: { [Op.ne]: null }
        },
        attributes: ['status']
      });

      if (matchedLinks.length === 0) {
        console.log(`⚠️ No cleanlink found for ${uniqueId}, skipping...`);
        continue;
      }

      // Step 3: Check if all matched links are pending or completed
      const hasPending = matchedLinks.every(link => link.status === 'pending');
      const hasCompleted = matchedLinks.every(link => link.status === 'Completed');

      if (hasPending) {
        console.log(`⏳ ${uniqueId} still has pending matchLink rows, skipping completion...`);
        continue;
      }

      if (hasCompleted) {
        // Step 4: If none are pending, update emailsent status to completed
        await emailsent2.update(
          { status: 'completed' },
          { where: { uniqueId } }
        );
        await VerificationUpload.update(
          { final_status: 'Completed' },
          { where: { uniqueId } }
        );

        console.log(`✅ ${uniqueId} marked as completed in emailsent`);

        // Step 5: Get email address for this uniqueId
        const emailRecord = await emailsent2.findOne({
          where: { uniqueId },
          attributes: ['email']
        });

        if (!emailRecord || !emailRecord.email) {
          console.log(`⚠️ No savedEmail found for ${uniqueId}, skipping email sending...`);
          continue;
        }

        const email = emailRecord.email;

        // Step 6: Send the email
        try {
          const mailOptions = {
            from: '"B2B LinkedIn Verification System" <b2bdirectdata@gmail.com>',
            to: email,
            subject: `B2B LinkedIn Verification System Completed - ${uniqueId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">B2B LinkedIn Verification System Completed</h2>
                <p>All Verification processes for ${uniqueId} have been completed.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">LinkedIn Verification System</h3>
                  <p><strong>File UniqueId:</strong> ${uniqueId}</p>
                </div>
                
                <p>All results are now available for download.</p>
                <p>Team,<br/>B2B Direct Data</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`📧 Completion email sent to ${email} for ${uniqueId}`);
        } catch (err) {
          console.error(`❌ Failed to send email for ${uniqueId}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in cron job:', error);
  }
}


cron.schedule('*/5 * * * *', async () => {
  try {
    const staleUsers = await User.findAll({
      where: {
        isProcessingFile2: true,
        processingStartTime2: {
          [Op.lt]: new Date(new Date() - 10 * 60 * 1000) // older than 5 mins
        }
      }
    });
    
    for (const user of staleUsers) {
      await user.update({ isProcessingFile2: false, processingStartTime2: null });
      
      
    }
  } catch (error) {
    console.error('Error in processing cleanup job:', error);
  }
});


// // Download endpoint with merged data
// app.get('/download-verification-data/:uniqueId', async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     // Get data from both tables
//     const [mainRecords, tempRecords] = await Promise.all([
//       VerificationUpload.findAll({ where: { uniqueId } }),
//       VerificationTemp.findAll({ where: { uniqueId } })
//     ]);

//     // Merge data - prioritize temp records but fall back to main records
//     const mergedData = mainRecords.map(mainRecord => {
//       const tempRecord = tempRecords.find(t => 
//         t.clean_linkedin_link === mainRecord.clean_link ||
//         t.clean_linkedin_link.replace('/details/experience/', '') === mainRecord.link
//       );
      
//       return {
//         // From main table
//         id: mainRecord.id,
//         uniqueId: mainRecord.uniqueId,
//         email: mainRecord.email,
//         link: mainRecord.link,
//         fileName: mainRecord.fileName,
//         creditsUsed: mainRecord.creditsUsed,
//         status: mainRecord.status,
//         date: mainRecord.date,
        
//         // From temp table (if available) or main table
//         full_name: tempRecord?.full_name || mainRecord.full_name,
//         head_title: tempRecord?.head_title || mainRecord.head_title,
//         head_location: tempRecord?.head_location || mainRecord.head_location,
//         title_1: tempRecord?.title_1 || mainRecord.title_1,
//         company_1: tempRecord?.company_1 || mainRecord.company_1,
//         company_link_1: tempRecord?.company_link_1 || mainRecord.company_link_1,
//         exp_duration: tempRecord?.exp_duration || mainRecord.exp_duration,
//         exp_location: tempRecord?.exp_location || mainRecord.exp_location,
//         job_type: tempRecord?.job_type || mainRecord.job_type,
//         title_2: tempRecord?.title_2 || mainRecord.title_2,
//         company_2: tempRecord?.company_2 || mainRecord.company_2,
//         company_link_2: tempRecord?.company_link_2 || mainRecord.company_link_2,
//         exp_duration_2: tempRecord?.exp_duration_2 || mainRecord.exp_duration_2,
//         exp_location_2: tempRecord?.exp_location_2 || mainRecord.exp_location_2,
//         job_type_2: tempRecord?.job_type_2 || mainRecord.job_type_2,
//         final_remarks: tempRecord?.final_remarks || mainRecord.final_remarks,
//         list_contacts_id: tempRecord?.list_contacts_id || mainRecord.list_contacts_id,
//         url_id: tempRecord?.url_id || mainRecord.url_id,
//         clean_link: tempRecord?.clean_linkedin_link || mainRecord.clean_link,
//         remark: tempRecord?.remark || mainRecord.remark,
        
//         // Sync info
//         last_sync: mainRecord.last_sync || 'Not synced'
//       };
//     });

//     // Create Excel file
//     const worksheet = XLSX.utils.json_to_sheet(mergedData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "VerificationData");
    
//     // Generate filename
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const fileName = `VerificationData_${uniqueId}_${timestamp}.xlsx`;
//     const filePath = path.join(__dirname, 'downloads', fileName);
    
//     // Ensure downloads directory exists
//     if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
//       fs.mkdirSync(path.join(__dirname, 'downloads'));
//     }
    
//     // Save file
//     XLSX.writeFile(workbook, filePath);
    
//     // Send file
//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         console.error('Download error:', err);
//       }
//       // Clean up file after download
//       fs.unlinkSync(filePath);
//     });

//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate download',
//       details: error.message
//     });
//   }
// });


//Scheduled sync job
function setupScheduledSyncCom() {
  cron.schedule('*/3 * * * *', async () => {
    try {
      console.log('Running scheduled sync from temp to main table...');
      
      const uniqueIds = await VerificationTemp_com.findAll({
        attributes: ['uniqueId'],
        group: ['uniqueId'],
        raw: true
      });

      for (const { uniqueId } of uniqueIds) {
        try {
          const response = await axios.post(
            `${process.env.VITE_API_BASE_URL}/sync-temp-to-main-com/${uniqueId}`
          );
          console.log(`Sync completed for ${uniqueId}:`, response.data);
        } catch (err) {
          console.error(`Error syncing ${uniqueId}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Scheduled job error:', error);
    }
  });

  console.log('Scheduled sync job initialized');
}

setupScheduledSyncCom();


// // Scheduled status check job
// function setupStatusCheckJob() {
//   cron.schedule('*/1 * * * *', async () => { // Every 2 minutes
//     try {
//       console.log('Running periodic status check for all uniqueIds...');
      
//       // Get all uniqueIds from VerificationUpload table
//       const uniqueIds = await VerificationUpload.findAll({
//         attributes: ['uniqueId'],
//         group: ['uniqueId'],
//         raw: true
//       });

//       for (const { uniqueId } of uniqueIds) {
//         try {
//           // Call your status check endpoint internally
//           const records = await VerificationUpload.findAll({
//             where: { uniqueId },
//             attributes: ['id', 'status', 'remark', 'final_status']
//           });

//           let updatedCount = 0;
          
//           // Process each record
//           for (const record of records) {
//             if (record.remark && record.remark !== 'pending' && record.final_status !== 'Completed') {
//               await VerificationUpload.update(
//                 { status: 'Completed', final_status : 'Completed' },
//                 { where: { id: record.id } }
//               );
//               updatedCount++;
//             }
//           }

//           console.log(`Status check completed for ${uniqueId}: ${updatedCount} records updated`);

//         } catch (err) {
//           console.error(`Error processing ${uniqueId}:`, err.message);
//         }
//       }

//       console.log('Periodic status check completed');
//     } catch (error) {
//       console.error('Status check job error:', error);
//     }
//   });

//   console.log('Status check job initialized (runs every 2 minutes)');
// }


     // Your existing sync job
// New status check job





// Scheduled status check job
function setupStatusCheckJob() {
  cron.schedule('*/3 * * * *', async () => { // Every 2 minutes
    try {
      console.log('Running periodic status check for all uniqueIds...');
      
      // Get all uniqueIds from VerificationUpload table
      const uniqueIds = await VerificationUpload.findAll({
        attributes: ['uniqueId'],
        group: ['uniqueId'],
        raw: true
      });

      for (const { uniqueId } of uniqueIds) {
        try {
          // Call your status check endpoint internally
          const records = await VerificationUpload.findAll({
            where: { uniqueId },
            attributes: ['id', 'status', 'remark', 'final_status']
          });

          let updatedCount = 0;
          
          // Process each record
          for (const record of records) {
            if (record.remark && record.remark !== 'pending' && record.final_status !== 'Completed') {
              await VerificationUpload.update(
                { final_status: 'Completed',status: 'Completed' },
                { where: { id: record.id } }
              );
              updatedCount++;
            }
          }

          console.log(`Status check completed for ${uniqueId}: ${updatedCount} records updated`);

        } catch (err) {
          console.error(`Error processing ${uniqueId}:`, err.message);
        }
      }

      console.log('Periodic status check completed');
    } catch (error) {
      console.error('Status check job error:', error);
    }
  });

  console.log('Status check job initialized (runs every 2 minutes)');
}

// Initialize both jobs
 // Your existing sync job
  setupStatusCheckJob();   // New status check job









// Scheduled status check job
function setupStatusCheckJobCom() {
  cron.schedule('*/3 * * * *', async () => { // Every 2 minutes
    try {
      console.log('Running periodic status check for all uniqueIds...');
      
      // Get all uniqueIds from VerificationUpload table
      const uniqueIds = await VerificationUpload_com.findAll({
        attributes: ['uniqueId'],
        group: ['uniqueId'],
        raw: true
      });

      for (const { uniqueId } of uniqueIds) {
        try {
          // Call your status check endpoint internally
          const records = await VerificationUpload_com.findAll({
            where: { uniqueId },
            attributes: ['id', 'status', 'remark', 'final_status']
          });

          let updatedCount = 0;
          
          // Process each record
          for (const record of records) {
            if (record.remark && record.remark !== 'pending' && record.final_status !== 'Completed') {
              await VerificationUpload_com.update(
                { final_status: 'Completed',status: 'Completed' },
                { where: { id: record.id } }
              );
              updatedCount++;
            }
          }

          console.log(`Status check completed for ${uniqueId}: ${updatedCount} records updated`);

        } catch (err) {
          console.error(`Error processing ${uniqueId}:`, err.message);
        }
      }

      console.log('Periodic status check completed');
    } catch (error) {
      console.error('Status check job error:', error);
    }
  });

  console.log('Status check job initialized (runs every 2 minutes)');
}

// Initialize both jobs
 // Your existing sync job
  setupStatusCheckJobCom();   // New status check job


app.post('/check-status-link/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // Find all records with the given uniqueId
    const records = await VerificationUpload.findAll({
      where: { uniqueId },
      attributes: ['status'] // Only fetch the final_status field
    });

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found with the provided uniqueId'
      });
    }

    // Check if all records have final_status as 'completed'
    const allCompleted = records.every(record => record.status === 'Completed');

    res.json({
      success: true,
      uniqueId,
      totalRecords: records.length,
      completedRecords: records.filter(r => r.status === 'Completed').length,
      allCompleted,
      status: allCompleted ? 'completed' : 'pending'
    });

  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.post('/check-status-link_com/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // Find all records with the given uniqueId
    const records = await VerificationUpload_com.findAll({
      where: { uniqueId },
      attributes: ['status'] // Only fetch the final_status field
    });

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found with the provided uniqueId'
      });
    }

    // Check if all records have final_status as 'completed'
    const allCompleted = records.every(record => record.status === 'Completed');

    res.json({
      success: true,
      uniqueId,
      totalRecords: records.length,
      completedRecords: records.filter(r => r.status === 'Completed').length,
      allCompleted,
      status: allCompleted ? 'completed' : 'pending'
    });

  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// async function processVerificationUploads() {
//   try {
//     // Get all unique groups that need processing
//     const uniqueGroups = await VerificationUpload_com.findAll({
//       attributes: ['id'],
//       group: ['id'],
//       where: {
//         final_status: {
//           [Op.ne]: 'Completed' // Only process groups not already marked Completed
//         }
//       }
//     });

//     for (const group of uniqueGroups) {
//       const id = group.id;
      
//       // Get all records for this uniqueId
//       const records = await VerificationUpload_com.findAll({
//         where: { id }
//       });

//       // Determine final status based on your rules
//       let finalStatus = 'Completed'; // Assume completed unless we find reasons otherwise

//       for (const record of records) {
//         // Rule 1: If any record has status 'Pending' AND remark contains 'pending'
//         if (record.status === 'Pending' && 
            
//             record.remark.toLowerCase().includes('pending')) {
//           finalStatus = 'Pending';
//           break; // No need to check further
//         }
        
//         // Rule 2: If any record has status 'Pending' (regardless of remark)
//         // We don't break here because a later record might trigger Rule 1
//         if (record.status === 'Pending') {
//           finalStatus = 'Completed';
//         }
//       }

//       // Update all records in this group
//       await VerificationUpload_com.update(
//         { final_status: finalStatus },
//         { where: { id } }
//       );

//       console.log(`Processed group ${id}: Final status = ${finalStatus}`);
//     }
//   } catch (error) {
//     console.error('Error processing verification uploads:', error);
//   }
// }


// // Run every minute
// setInterval(processVerificationUploads, 10 * 1000);

// // Initial run
// processVerificationUploads();




// async function processVerificationUploads_link() {
//   try {
//     // Get all unique groups that need processing
//     const uniqueGroups = await VerificationUpload.findAll({
//       attributes: ['id'],
//       group: ['id'],
//       where: {
//         final_status: {
//           [Op.ne]: 'Completed' // Only process groups not already marked Completed
//         }
//       }
//     });

//     for (const group of uniqueGroups) {
//       const id = group.id;
      
//       // Get all records for this uniqueId
//       const records = await VerificationUpload.findAll({
//         where: { id }
//       });

//       // Determine final status based on your rules
//       let finalStatus = 'Completed'; // Assume completed unless we find reasons otherwise

//       for (const record of records) {
//         // Rule 1: If any record has status 'Pending' AND remark contains 'pending'
//         if (record.status === 'Pending' && 
            
//             record.remark.toLowerCase().includes('pending')) {
//           finalStatus = 'Pending';
//           break; // No need to check further
//         }
        
//         // Rule 2: If any record has status 'Pending' (regardless of remark)
//         // We don't break here because a later record might trigger Rule 1
//         if (record.status === 'Pending') {
//           finalStatus = 'Completed';
//         }
//       }

//       // Update all records in this group
//       await VerificationUpload.update(
//         { final_status: finalStatus },
//         { where: { id } }
//       );

//       console.log(`Processed group ${id}: Final status = ${finalStatus}`);
//     }
//   } catch (error) {
//     console.error('Error processing verification uploads:', error);
//   }
// }


// // Run every minute
// setInterval(processVerificationUploads_link, 10 * 1000);

// // Initial run
// processVerificationUploads_link();







app.get('/get-verification-uploads', async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    
    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'User email is required in headers' 
      });
    }

    const uploads = await VerificationUpload.findAll({
      where: { email: userEmail },
      order: [['date', 'DESC']]
    });

    res.json(uploads);
  } catch (error) {
    console.error('Error fetching verification uploads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch verification uploads',
      error: error.message 
    });
  }
});





// Get company verification uploads for a specific user
app.get('/get-company-verification-uploads', async (req, res) => {
  try {
    const userEmail = req.headers['user-email'];
    
    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'User email is required in headers' 
      });
    }

    const uploads = await VerificationUpload_com.findAll({
      where: { email: userEmail },
      order: [['date', 'DESC']]
    });

    res.json(uploads);
  } catch (error) {
    console.error('Error fetching company verification uploads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch company verification uploads',
      error: error.message 
    });
  }
});




const paymentRoutes = require('./routes/paymentRoutes');
// Routes
app.use('/api/payments', paymentRoutes);

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






app.post('/api/payments/update-credits', async (req, res) => {
  try {
    const { email, creditsToAdd } = req.body;

    // Find user and update credits
    const user = await User.findOne({ where: { userEmail: email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update credits (existing + new)
    const updatedCredits = user.credits + parseInt(creditsToAdd);
    await user.update({ credits: updatedCredits });

    res.status(200).json({ 
      success: true,
      newCredits: updatedCredits
    });
  } catch (error) {
    console.error('Credit update error:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});











const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// const { sendOtpEmail } = require('../backend/routes/mailer');
// const rateLimit = require('express-rate-limit');

// // Rate limiting for OTP requests
// const otpLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 3, // limit each IP to 3 OTP requests per windowMs
//   message: 'Too many OTP requests from this IP, please try again later'
// });



// // Send OTP for password reset
// app.post('/send-otp', otpLimiter, async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Validate email format
//     if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       return res.status(400).json({ message: "Please provide a valid email address." });
//     }

//     const user = await User.findOne({ where: { userEmail: email } });
//     if (!user) {
//       return res.status(404).json({ message: "If this email exists, we've sent an OTP to it." });
//     }

//     // Check if user is blocked from OTP requests
//     if (user.otpBlockedUntil && user.otpBlockedUntil > new Date()) {
//       return res.status(429).json({ 
//         message: `Too many attempts. Try again after ${user.otpBlockedUntil.toLocaleTimeString()}`
//       });
//     }

//     // Generate a 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

//     // Update user with OTP and expiry
//     await user.update({ 
//       resetPasswordOtp: otp,
//       resetPasswordOtpExpiry: otpExpiry,
//       otpAttempts: 0 // Reset attempts when new OTP is sent
//     });

//     // Send OTP via email
//     const emailSent = await sendOtpEmail(email, otp);
    
//     if (!emailSent) {
//       return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
//     }

//     res.status(200).json({ 
//       message: "OTP sent to your email address.",
//       // Don't send OTP in response in production
//       otp: process.env.NODE_ENV === 'development' ? otp : null 
//     });
//   } catch (error) {
//     console.error("OTP send error:", error);
//     res.status(500).json({ message: "Server error.", error: error.message });
//   }
// });

// // Reset password with OTP
// app.post('/reset-password', async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     if (!email || !otp || !newPassword) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({ message: "Password must be at least 8 characters long." });
//     }

//     const user = await User.findOne({ where: { userEmail: email } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Check if OTP matches and is not expired
//     if (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordOtpExpiry) {
//       // Increment failed attempts
//       const attempts = (user.otpAttempts || 0) + 1;
//       let otpBlockedUntil = null;
      
//       // Block after 3 failed attempts for 15 minutes
//       if (attempts >= 3) {
//         otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000);
//       }
      
//       await user.update({ 
//         otpAttempts: attempts,
//         otpBlockedUntil
//       });
      
//       return res.status(400).json({ 
//         message: attempts >= 3 
//           ? "Too many incorrect attempts. Try again later." 
//           : "Invalid or expired OTP." 
//       });
//     }

//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update user password and clear OTP fields
//     await user.update({ 
//       userPassword: hashedPassword,
//       resetPasswordOtp: null,
//       resetPasswordOtpExpiry: null,
//       otpAttempts: 0,
//       otpBlockedUntil: null
//     });

//     res.status(200).json({ message: "Password reset successfully." });
//   } catch (error) {
//     console.error("Password reset error:", error);
//     res.status(500).json({ message: "Server error.", error: error.message });
//   }
// });




// // Add this route to handle status completion emails
// app.post('/api/send-completion-email', async (req, res) => {
//   try {
//     const { email, uniqueId, totalRecords, completedRecords } = req.body;



//     // Send email
//     await transporter.sendMail({
//       from: '"Verification System" <your-email@example.com>',
//       to: email,
//       subject: `Verification Completed - ${uniqueId}`,
//       html: `
//         <h2>Verification Process Completed</h2>
//         <p>Your verification job with ID <strong>${uniqueId}</strong> has been completed.</p>
//         <p><strong>Results:</strong></p>
//         <ul>
//           <li>Total records: ${totalRecords}</li>
//           <li>Completed records: ${completedRecords}</li>
//         </ul>
//         <p>You can now download the results from your dashboard.</p>
//         <p>Thank you for using our service!</p>
//       `
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Email send error:', error);
//     res.status(500).json({ error: 'Failed to send completion email' });
//   }
// });

app.post('/api/send-completion-email',auth, async (req, res) => {
  try {
    const { email, uniqueId, totalRecords, completedRecords } = req.body;

    // First check if email was already sent
    const existingRecord = await VerificationUpload.findOne({
      where: { uniqueId }
    });

    if (existingRecord && existingRecord.emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email was already sent previously' 
      });
    }

    // Mark email as sent in database before actually sending
    await VerificationUpload.update(
      { 
        emailSent: true,
        emailSentAt: new Date() 
      },
      { where: { uniqueId } }
    );

    // Now send the email
    await transporter.sendMail({
      from: '"B2B Verification System" <b2bdirectdata@gmail.com>',
      to: email,
      subject: `Contact Verification Completed - ${uniqueId}`,
      html: `
        <h2>Contact Verification Completed</h2>
        <p>Your verification job with ID <strong>${uniqueId}</strong> has been completed.</p>
        <p><strong>Results:</strong></p>
         <ul>
           <li>Total records: ${totalRecords}</li>
          <li>Completed records: ${completedRecords}</li>
         </ul>
        <p>You can now download the results from your dashboard.</p>
        <p>Thank you for using our service!</p>
        <p>Team,<br/>B2B Direct Data</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    
    // If email failed, reset the emailSent flag
    await VerificationUpload.update(
      { emailSent: false },
      { where: { uniqueId } }
    );
    
    res.status(500).json({ error: 'Failed to send completion email' });
  }
});



// app.post('/api/send-completion-email-com', async (req, res) => {
//   try {
//     const { email, uniqueId, totalRecords, completedRecords } = req.body;

//     // Send email
//     await transporter.sendMail({
//       from: '"Company Verification System" <noreply@yourdomain.com>',
//       to: email,
//       subject: `Company Verification Completed - ${uniqueId}`,
//       html: `
//         <h2>Company Verification Process Completed</h2>
//         <p>Your company verification job with ID <strong>${uniqueId}</strong> has been completed.</p>
//         <p><strong>Results:</strong></p>
//         <ul>
//           <li>Total companies processed: ${totalRecords}</li>
//           <li>Successfully verified: ${completedRecords}</li>
//         </ul>
//         <p>You can now download the results from your dashboard.</p>
//         <p>Thank you for using our service!</p>
//       `
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Email send error:', error);
//     res.status(500).json({ error: 'Failed to send completion email' });
//   }
// });


app.post('/api/send-completion-email-com',auth, async (req, res) => {
  try {
    const { email, uniqueId, totalRecords, completedRecords } = req.body;

    // First check if email was already sent
    const existingRecord = await VerificationUpload_com.findOne({
      where: { uniqueId }
    });

    if (existingRecord && existingRecord.emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email was already sent previously' 
      });
    }

    // Mark email as sent in database before actually sending
    await VerificationUpload_com.update(
      { 
        emailSent: true,
        emailSentAt: new Date() 
      },
      { where: { uniqueId } }
    );

    // Now send the email
    await transporter.sendMail({
      from: '"B2B Verification System" <b2bdirectdata@gmail.com>',
      to: email,
      subject: `Company Details Completed - ${uniqueId}`,
      html: `
        <h2>Company Details Completed</h2>
        <p>Your verification job with ID <strong>${uniqueId}</strong> has been completed.</p>
        <p><strong>Results:</strong></p>
        <ul>
          <li>Total records: ${totalRecords}</li>
          <li>Completed records: ${completedRecords}</li>
        </ul>
        <p>You can now download the results from your dashboard.</p>
        <p>Thank you for using our service!</p>
        <p>Team,<br/>B2B Direct Data</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    
    // If email failed, reset the emailSent flag
    await VerificationUpload_com.update(
      { emailSent: false },
      { where: { uniqueId } }
    );
    
    res.status(500).json({ error: 'Failed to send completion email' });
  }
});


// app.post('/api/send-completion-email', async (req, res) => {
//   try {
//     const { email, uniqueId, totalRecords, completedRecords } = req.body;

//     // First check if email was already sent
//     const existingRecord = await VerificationUpload.findOne({
//       where: { uniqueId }
//     });

//     if (existingRecord && existingRecord.emailSent) {
//       return res.status(200).json({ 
//         success: true, 
//         message: 'Email was already sent previously' 
//       });
//     }

//     // Mark email as sent in database before actually sending
//     await VerificationUpload.update(
//       { 
//         emailSent: true,
//         emailSentAt: new Date() 
//       },
//       { where: { uniqueId } }
//     );

//     // Now send the email
//     await transporter.sendMail({
//       from: '"Verification System" <your-email@example.com>',
//       to: email,
//       subject: `Verification Completed - ${uniqueId}`,
//       html: `
//         <h2>Verification Process Completed</h2>
//         <p>Your verification job with ID <strong>${uniqueId}</strong> has been completed.</p>
//         <p><strong>Results:</strong></p>
//         <ul>
//           <li>Total records: ${totalRecords}</li>
//           <li>Completed records: ${completedRecords}</li>
//         </ul>
//         <p>You can now download the results from your dashboard.</p>
//         <p>Thank you for using our service!</p>
//       `
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Email send error:', error);
    
//     // If email failed, reset the emailSent flag
//     await VerificationUpload.update(
//       { emailSent: false },
//       { where: { uniqueId } }
//     );
    
//     res.status(500).json({ error: 'Failed to send completion email' });
//   }
// });











// Server-side route
app.post('/change-password', auth, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // Find user in database
    const user = await User.findOne({ where: { userEmail: email } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.userPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.update(
      { userPassword: hashedPassword },
      { where: { userEmail: email } }
    );
    
    res.json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "An error occurred while changing password." });
  }
});

const { DataTypes } = require('sequelize');
const TeamEmail = require('./model/team_notification');
const Subscriber =require("./model/removeData")
const OtpVerification =require('./model/otp_verfication')






app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    await OtpVerification.create({
      email,
      otp,
      expires_at,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || "b2bdirectdata@gmail.com",
      to: email,
      subject: 'Your OTP for API Waitlist',
      text: `Your OTP is: ${otp}\n\nThis OTP will expire in 2 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the most recent OTP for this email
    const verification = await OtpVerification.findOne({
      where: {
        email,
        verified: false,
        expires_at: { [Op.gt]: new Date() }, // Changed expiresAt to expires_at
      },
      order: [['createdAt', 'DESC']],
    });

    if (!verification) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    await verification.update({ verified: true });

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;
    
    // Validate required fields
    if (!email || !fullName) {
      return res.status(400).json({ 
        message: 'Email and full name are required',
        existingSubscriber: false
      });
    }

    // Check if subscriber already exists in database
    const existingSubscriber = await Subscriber.findOne({ 
      where: { email } // Fixed: Added where clause
    });
    
    if (existingSubscriber) {
      return res.status(200).json({ 
        message: 'You are already in our removal queue',
        existingSubscriber: true
      });
    }
    
    // Create new subscriber
    const newSubscriber = await Subscriber.create({
      email,
      full_name: fullName, // Make sure this matches your model definition
      phone: phone || null, // Phone is optional
      removal_requested_at: new Date() // Make sure this matches your model definition
    });
    
    res.status(200).json({ 
      message: 'Your removal request has been processed',
      existingSubscriber: false
    });
  } catch (error) {
    console.error('Error processing removal request:', error);
    res.status(500).json({ 
      message: 'Failed to process removal request',
      error: error.message 
    });
  }
});



// Send confirmation email route
app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    const mailOptions = {
      from: "b2bdirectdata@gmail.com",
      to: email,
      subject: subject,
      text: message
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ message: 'Failed to send confirmation email' });
  }
});






// Route to create a new team email
app.post('/api/team-emails', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create the new team email record
    const newTeamEmail = await TeamEmail.create({
      email,
      name: name || null // Set to null if name is not provided
    });

    // Return the created record
    res.status(201).json({
      message: 'Team email created successfully',
      data: newTeamEmail
    });

  } catch (error) {
    console.error('Error creating team email:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({ errors });
    }
    
    // Handle duplicate email error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generic error handler
    res.status(500).json({ error: 'Internal server error' });
  }
});








// app.post('/api/send-verification-confirmation', async (req, res) => {
//   const { email, uniqueId, totalLinks, pendingCount, creditCost, initiatedBy } = req.body;

//   try {
//     const mailOptions = {
//       from: "b2bdirectdata@gmail.com",
//       to: email,
//       subject: `LinkedIn Verification Process Started - ${uniqueId}`,
//       html: `
//         <h2>LinkedIn Verification Process Started</h2>
//         <p><strong>Batch ID:</strong> ${uniqueId}</p>
//         <p><strong>Total Links:</strong> ${totalLinks}</p>
//         <p><strong>Pending Verification:</strong> ${pendingCount}</p>
//         <p><strong>Credits Deducted:</strong> ${creditCost}</p>
//         ${initiatedBy ? `<p><strong>Initiated By:</strong> ${initiatedBy}</p>` : ''}
//         <p>You'll receive another email when the verification is complete.</p>
//         <p>Thank you for using our service!</p>
//       `
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error sending confirmation email:', error);
//     res.status(500).json({ error: 'Failed to send confirmation email' });
//   }
// });






















// Email confirmation endpoint
app.post('/api/send-verification-confirmation/company', auth, async (req, res) => {
  const { email, uniqueId, totalLinks, pendingCount, creditCost, initiatedBy } = req.body;

  try {
    // Validate recipient email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid recipient email address'
      });
    }

    const mailOptions = {
      from: `"B2B Company Details" <b2bdirectdata@gmail.com>`,
      to: email,
      subject: `Please Start Company Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Link Uploaded . Please Start Company Details </h2>
          
          <p><strong>Total Links:</strong> ${totalLinks}</p>
          
          <p>Team,<br/>B2B Direct Data</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`, info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error(`Error sending to ${email}:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: 'Failed to send confirmation email'
    });
  }
});





// GET /api/links/report
app.get('/api/links/report',auth, async (req, res) => {
  try {
    // First get aggregated data
    const links = await Link.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('COUNT', sequelize.col('link')), 'linkCount'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('COUNT', sequelize.col('matchLink')), 'matchCount'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('creditDeducted')), 'creditDeducted'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status != 'pending' THEN 1 ELSE 0 END")), 'completedCount'],
        
      ],
      group: ['uniqueId'],
      order: [['date', 'DESC']]
    });

    // Then get status details for each uniqueId
    const statusDetails = await Link.findAll({
      attributes: [
        'uniqueId',
        'status'
      ],
      where: {
        uniqueId: links.map(link => link.uniqueId)
      }
    });

    // Group statuses by uniqueId
    const statusByUniqueId = statusDetails.reduce((acc, item) => {
      if (!acc[item.uniqueId]) {
        acc[item.uniqueId] = [];
      }
      acc[item.uniqueId].push(item.status);
      return acc;
    }, {});

    const report = {
      tableName: "Direct Number Enrichment",
      data: links.map(link => {
        const allStatuses = statusByUniqueId[link.uniqueId] || [];
        const isCompleted = allStatuses.every(status => status !== 'pending');
        
        return {
          uniqueId: link.uniqueId,
          totallink: link.get('totallink'),
          matchCount: link.get('matchCount'),
          fileName: link.get('fileName'),
          date: link.get('date'),
          email: link.get('email'),
          remainingCredits : link.get('remainingCredits'),
          creditDeducted: link.get('creditDeducted') || 0,
          status: isCompleted ? 'completed' : 'pending',
          completedCount: link.get('completedCount'),
          
        };
      })
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching links report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});




// GET /api/company-verifications/report
app.get('/api/company-verifications/report', auth, async (req, res) => {
  try {
    const verifications = await VerificationUpload_com.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('MAX', sequelize.col('pendingCount')), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('status')), 'status'],
        [sequelize.fn('MIN', sequelize.col('final_status')), 'final_status'],
       
        [sequelize.fn('MIN', sequelize.col('creditsUsed')), 'creditsUsed'],
      
      ],
      group: ['uniqueId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });

    const report = {
      tableName: "Company Verification Report",
      data: verifications.map(item => ({
        uniqueId: item.uniqueId,
        email: item.get('email'),
        remainingCredits : item.get('remainingCredits'),
        fileName: item.get('fileName'),
        date: item.get('date'),
        totallink: item.get('totallink'),
        pendingCount: item.get('pendingCount'),
        
        final_status: item.get('final_status'),
        
        creditsUsed: item.get('creditsUsed') || 0,
        
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching company verification report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});



// GET /api/company-verifications/report
app.get('/api/verifications/report', auth, async (req, res) => {
  try {
    const verifications = await VerificationUpload.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('MAX', sequelize.col('pendingCount')), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('status')), 'status'],
        [sequelize.fn('MIN', sequelize.col('final_status')), 'final_status'],
       
        [sequelize.fn('MIN', sequelize.col('creditsUsed')), 'creditsUsed'],
        
      ],
      group: ['uniqueId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });

    const report = {
      tableName: "Company Verification Report",
      data: verifications.map(item => ({
        uniqueId: item.uniqueId,
        email: item.get('email'),
        remainingCredits : item.get('remainingCredits'),
        fileName: item.get('fileName'),
        date: item.get('date'),
        totallink: item.get('totallink'),
        pendingCount: item.get('pendingCount'),
       
        final_status: item.get('final_status'),
       
        creditsUsed: item.get('creditsUsed') || 0,
        
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching company verification report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});




const CreditTransaction = require("../backend/model/creditTransactionModel");


// GET /api/credit-transactions
app.get('/api/credit-transactions',auth, async (req, res) => {
  try {
    const transactions = await CreditTransaction.findAll({
      order: [['createdAt', 'DESC']] // Show newest first
    });
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});


const SuperAdminTransaction = require("../backend/model/superAdminModel");


// GET /api/superadmin-transactions
app.get('/api/superadmin-transactions', async (req, res) => {
  try {
    const transactions = await SuperAdminTransaction.findAll({
      order: [['date', 'DESC']] // Show newest first
    });
    
    res.json({
      success: true,
      data: transactions.map(t => ({
        ...t.get({ plain: true }),
        // Format date if needed
        formattedDate: t.date.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching superadmin transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});







// Get createdBy value for a specific userEmail
app.get('/user/creator/:userEmail', auth, async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    // Basic email validation
    if (!userEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email
    const user = await User.findOne({
      where: { 
        userEmail: userEmail 
      },
      attributes: ['userEmail', 'createdBy'] // Only return these fields
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        userEmail: userEmail,
        createdBy: null
      });
    }

    res.json({
      userEmail: user.userEmail,
      createdBy: user.createdBy
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});




const  CompletedReport = require("./model/CompletedReport")





// In your routes file
app.post('/api/save-completed-reports', auth, async (req, res) => {
  try {
    const { reports } = req.body;
    
    // Save each report to your database
    const savedReports = await Promise.all(
      reports.map(async (report) => {
        // Check if report already exists
        const existing = await CompletedReport.findOne({ 
          where: { 
            uniqueId: report.uniqueId,
            type: report.type 
          } 
        });
        
        if (existing) {
          return existing;
        }
        
        // Create new record
        return await CompletedReport.create({
          process: report.process,
          uniqueId: report.uniqueId,
          totalLinks: report.totallink,
          matchCount: report.matchCount,
          fileName: report.fileName,
          date: report.date,
          email: report.email,
          createdBy: report.createdBy,
          transactionType: report.transactionType,
          amount: report.amount,
          status: report.finalStatus,
          type: report.type,
          // Add any other relevant fields
        });
      })
    );

    res.json({
      success: true,
      count: savedReports.length,
      savedReports
    });
  } catch (error) {
    console.error('Error saving completed reports:', error);
    res.status(500).json({ error: 'Failed to save completed reports' });
  }
});





app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "b2bdirectdata@gmail.com", // Your Gmail address
    pass: "npgjrjuebmlmepgy"  // Your Gmail password or app password
    }
  });

  // Email options
  const mailOptions = {
    from: email,
    to: 'b2bdirectdata@gmail.com',
    subject: `New Contact Form Submission from ${name}`,
    text: message,
    html: `<p>You have a new contact form submission</p>
           <p><strong>Name: </strong> ${name}</p>
           <p><strong>Email: </strong> ${email}</p>
           <p><strong>Message: </strong> ${message}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending email' });
  }
});




const Razorpay = require('razorpay');



// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: "rzp_test_AbCdEfGhIjKlM",
  key_secret: 'NnBbVvCcXxZzSsDdFfGgHhJjKkLl',
});


// Create Order Endpoint
app.post('/create-order', async (req, res) => {
  try {
    console.log('Creating order with amount:', req.body.amount);
    
    if (!req.body.amount || isNaN(req.body.amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const options = {
      amount: req.body.amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
    
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: err.error?.description || err.message 
    });
  }
});

// Verify Payment Endpoint
app.post('/verify-payment', (req, res) => {
  try {
    const { orderCreationId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'NnBbVvCcXxZzSsDdFfGgHhJjKkLl')
      .update(`${orderCreationId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    res.json({ status: 'success', paymentId: razorpayPaymentId });
    
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});








// GET /api/verification-uploads/report
app.get('/VerificationUpload/report',auth, async (req, res) => {
  try {
    const verifications = await VerificationUpload.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('MAX', sequelize.col('pendingCount')), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('status')), 'status'],
        [sequelize.fn('MAX', sequelize.col('final_status')), 'final_status'],
        // Count completed statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN final_status = 'Completed' THEN 1 ELSE 0 END`)), 'completedCount'],
        // Count pending statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN final_status = 'Pending' THEN 1 ELSE 0 END`)), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('creditsUsed')), 'creditsUsed'],
      ],
      group: ['uniqueId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });

    const report = {
      tableName: "Verification Uploads Report",
      data: verifications.map(item => ({
        uniqueId: item.uniqueId,
        email: item.get('email'),
        remainingCredits: item.get('remainingCredits'),
        fileName: item.get('fileName'),
        date: item.get('date'),
        totallink: item.get('totallink'),
        pendingCount: item.get('pendingCount'),
        status: item.get('status'),
        final_status: item.get('final_status'),
        completedCount: item.get('completedCount') || 0,
        pendingCount: item.get('pendingCount') || 0,
        creditsUsed: item.get('creditsUsed') || 0,
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching verification uploads report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});




// GET /api/verification-uploads/report
app.get('/company/report',auth, async (req, res) => {
  try {
    const verifications = await VerificationUpload_com.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('MAX', sequelize.col('pendingCount')), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('status')), 'status'],
        [sequelize.fn('MAX', sequelize.col('final_status')), 'final_status'],
        // Count completed statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN final_status = 'Completed' THEN 1 ELSE 0 END`)), 'completedCount'],
        // Count pending statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN final_status = 'Pending' THEN 1 ELSE 0 END`)), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('creditsUsed')), 'creditsUsed'],
      ],
      group: ['uniqueId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });

    const report = {
      tableName: "Company Details",
      data: verifications.map(item => ({
        uniqueId: item.uniqueId,
        email: item.get('email'),
        remainingCredits: item.get('remainingCredits'),
        fileName: item.get('fileName'),
        date: item.get('date'),
        totallink: item.get('totallink'),
        pendingCount: item.get('pendingCount'),
        status: item.get('status'),
        final_status: item.get('final_status'),
        completedCount: item.get('completedCount') || 0,
        pendingCount: item.get('pendingCount') || 0,
        creditsUsed: item.get('creditsUsed') || 0,
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching verification uploads report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});


// GET /api/verification-uploads/report
app.get('/Direct-number/report', auth,async (req, res) => {
  try {
    const verifications = await Link.findAll({
      attributes: [
        'uniqueId',
        [sequelize.fn('MIN', sequelize.col('email')), 'email'],
        [sequelize.fn('MIN', sequelize.col('remainingCredits')), 'remainingCredits'],
        [sequelize.fn('MIN', sequelize.col('fileName')), 'fileName'],
        [sequelize.fn('MIN', sequelize.col('date')), 'date'],
        [sequelize.fn('MIN', sequelize.col('totallink')), 'totallink'],
        [sequelize.fn('MAX', sequelize.col('matchCount')), 'matchCount'],
        // [sequelize.fn('MIN', sequelize.col('status')), 'status'],
        [sequelize.fn('MAX', sequelize.col('status')), 'status'],
        // Count completed statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = 'completed' THEN 1 ELSE 0 END`)), 'completedCount'],
        // Count pending statuses
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = 'pending' THEN 1 ELSE 0 END`)), 'pendingCount'],
        [sequelize.fn('MIN', sequelize.col('creditDeducted')), 'creditDeducted'],
      ],
      group: ['uniqueId'],
      order: [[sequelize.fn('MIN', sequelize.col('date')), 'DESC']]
    });

    const report = {
      tableName: "Direct number",
      data: verifications.map(item => ({
        uniqueId: item.uniqueId,
        email: item.get('email'),
        remainingCredits: item.get('remainingCredits'),
        fileName: item.get('fileName'),
        date: item.get('date'),
        totallink: item.get('totallink'),
        pendingCount: item.get('matchCount'),
        status: item.get('status'),
        
        completedCount: item.get('completedCount') || 0,
        pendingCount: item.get('pendingCount') || 0,
        creditsUsed: item.get('creditDeducted') || 0,
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching verification uploads report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});







app.patch('/users/update-single-credit-cost', auth,async (req, res) => {
  try {
    const { userEmail, field, value, updatedBy } = req.body;

    // Validate inputs
    if (!userEmail || !field || value === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['userEmail', 'field', 'value']
      });
    }

    const validFields = ['creditCostPerLink', 'creditCostPerLink_V',"creditCostPerLink_C"];
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        message: 'Invalid field specified',
        validFields
      });
    }

    if (value <= 0) {
      return res.status(400).json({ 
        message: 'Value must be greater than 0'
      });
    }

    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the specific field
    user[field] = value;
    await user.save();

    res.json({ 
      message: `${field} updated successfully`,
      data: {
        [field]: user[field],
        userEmail: user.userEmail
      }
    });
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    res.status(500).json({ 
      message: `Server error while updating ${field}`,
      error: error.message 
    });
  }
});