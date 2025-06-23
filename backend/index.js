const express = require('express')
const app = express()

const multer = require('multer');
const xlsx= require('xlsx');
const { Op } = require('sequelize');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { sequelize,LinkedInProfile } = require('./config/db');
const Link = require('./model/Link');

const fs = require('fs');
const MasterUrl = require('./model/MasterUrl'); // MasterUrl model
const TempLinkMobile = require('./model/TempLinkMobile');///tempmobile
const User  = require('./model/userModel'); // Adjust path as needed

const path=require("path");


const cors = require('cors');
require('dotenv').config();  // Load the .env file

const PORT =  8080;
  
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
 
const upload = multer({ dest: 'uploads/' });

app.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract and filter LinkedIn links with more comprehensive matching
    const links = rows.flat().filter(cell => 
      typeof cell === 'string' && 
      cell.toLowerCase().includes('linkedin.com')
    );

    if (links.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'No LinkedIn links found.' });
    }

    const uniqueId = uuidv4();
    let matchCount = 0;

    for (const link of links) {
      // First determine the link type/remark
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

      // Clean the link only if it's marked as 'ok'
      let cleanedLink = link;
      if (remark === 'ok') {
        cleanedLink = link
          .replace(/Linkedin\.Com\/In\//i, 'linkedin.com/in/')
          .replace(/linkedin\.com\/\/in\//i, 'linkedin.com/in/')
          .toLowerCase();
      }

      let matchLink = null;
      let linkedinLinkId = null;

      // Only try to match if it's a clean profile link
      if (remark === 'ok') {
        const matched = await MasterUrl.findOne({
          where: { clean_linkedin_link: cleanedLink },
          attributes: ['linkedin_link_id', 'clean_linkedin_link'],
        });

        if (matched) {
          matchLink = cleanedLink;
          linkedinLinkId = matched.linkedin_link_id;
          matchCount++;
         
        }
      }

      await Link.create({
        uniqueId,
        email,
        link,
        totallink: links.length,
        clean_link: cleanedLink,
        remark,
        fileName: req.file.originalname,
        matchLink,
        linkedin_link_id: linkedinLinkId,
        matchCount,
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      message: 'Upload successful',
      uniqueId,
      fileName: req.file.originalname,
      totallink: links.length,
      matchCount,
    });

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

app.post('/confirm-upload', async (req, res) => {
  try {
    const { uniqueId, email } = req.body;
    
    // Find all matched links for this upload
    const matchedLinks = await Link.findAll({
      where: { 
        uniqueId,
        email,
        matchLink: { [Op.ne]: null } // Only links that have matches
      }
    });

    // Create TempLinkMobile records for each match
    for (const link of matchedLinks) {
      await TempLinkMobile.create({
        uniqueId: link.uniqueId,
        matchLink: link.matchLink,
        linkedin_link_id: link.linkedin_link_id
      });
    }

    res.json({
      success: true,
      message: 'Temp records created successfully',
      count: matchedLinks.length
    });

  } catch (err) {
    console.error('Confirmation error:', err);
    res.status(500).json({ error: 'Confirmation failed', details: err.message });
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
  
  
  
  


  // Add this to your server routes
app.delete('/cancel-upload/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    // Delete from both tables in a transaction
    await sequelize.transaction(async (t) => {
      await TempLinkMobile.destroy({ 
        where: { uniqueId },
        transaction: t 
      });
      
      await Link.destroy({ 
        where: { uniqueId },
        transaction: t 
      });
    });

    res.json({ success: true, message: 'Upload canceled and data deleted' });
  } catch (err) {
    console.error('Cancel upload error:', err);
    res.status(500).json({ error: 'Failed to cancel upload' });
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




  
  
  
  
  
  
  
  
const cron = require('node-cron');
  
cron.schedule('*/30 * * * * *', async () => {
  try {
    console.log('🔄 Cron Job: Syncing TempLinkMobile ➝ Link...');

    // Fetch all records from TempLinkMobile table
    const tempRecords = await TempLinkMobile.findAll();

    for (const temp of tempRecords) {
      const {
        id, // required to delete
        uniqueId,
        linkedin_link_id,
        mobile_number,
        mobile_number_2,
        person_name,
        person_location
      } = temp;

      // Skip if linkedin_link_id or uniqueId is missing
      if (!linkedin_link_id || !uniqueId) {
        console.log(`⚠️ Skipping record: Missing linkedin_link_id or uniqueId`);
        continue;
      }

      // Find matching Link record
      const linkRecord = await Link.findOne({
        where: {
          linkedin_link_id,
          uniqueId,
        }
      });

      if (!linkRecord) {
        console.log(`⚠️ No Link found for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId}`);
        continue;
      }
let status;

if (
  (mobile_number === null || mobile_number === "N/A") &&
  (mobile_number_2 === null || mobile_number_2 === "N/A")
) {
  status = "pending";
} else {
  status = "completed";
}

      // Prepare data for update
      const updateData = {
        mobile_number,
        mobile_number_2,
        person_name,
        person_location,
        status,
      };

      const [updated] = await Link.update(updateData, {
        where: {
          linkedin_link_id,
          uniqueId,
        },
      });

      if (updated > 0) {
        console.log(`✅ Link updated for linkedin_link_id: ${linkedin_link_id}, uniqueId: ${uniqueId} | Status: ${status}`);

        // ✅ If status is completed, delete from TempLinkMobile
        if (status === 'completed') {
          await TempLinkMobile.destroy({ where: { id } });
          console.log(`🗑️ Deleted TempLinkMobile record with id: ${id}`);
        }
      }
    }

    console.log('✅ Sync complete.\n');
  } catch (err) {
    console.error('❌ Error during sync:', err);
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





app.post('/api/credit-cost', async (req, res) => {
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

const mobileEnrichmentRoutes = require('./routes/mobileEnrichmentRoutes')
app.use('/mobileEnrichments', mobileEnrichmentRoutes)

const userRoutes = require('./routes/userRoutes')
app.use('/users', userRoutes)

// const creditRoutes = require('./routes/creditRoutes')
// app.use('/api', creditRoutes)

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
app.post('/send-upload-notification', async (req, res) => {
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

const paymentRoutes = require('./routes/paymentRoutes')
app.use('/api/payments', paymentRoutes);

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








// 2 step

const VerificationUpload = require('./model/verification_upload'); // Correct model name

app.post('/upload-excel-verification', upload.single('file'), async (req, res) => {
  try {
    const email = req.headers['user-email'];
    if (!email) return res.status(400).json({ error: "Email required" });

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

    const uniqueId = uuidv4();
    let pendingCount = 0; // Initialize pending count

    const categorizedLinks = links.map(link => {
      let remark;
     
      if (/linkedin\.com\/(sales\/lead|sales\/people)\/ACw|ACo|acw|acw/i.test(link)) {
        remark = 'Sales Navigator Link';
      } else if (/linkedin\.com\/(in)\/(ACw|ACo|acw)([^a-z0-9]|$)/i.test(link)) {
        remark = 'Sales Navigator Link';
      } else if (/linkedin\.com\/company/i.test(link)) {
        remark = 'Company Link';
      } else if (/linkedin\.com\/pub\//i.test(link)) {
        remark = 'This page doesn’t exist';
      } else if (!/linkedin\.com\/in\//i.test(link)) {
        remark = 'Junk Link';
      } else if (/linkedin\.com\/in\/[^\/]{1,4}$/i.test(link)) {
        remark = 'Invalid Profile Link';
      } else {
        remark = 'pending';
        pendingCount++; // Increment pending count
      }

      return {
        uniqueId,
        email,
        link,
        totallink: links.length,
        clean_link: link,
        remark,
        fileName: req.file.originalname,
        pendingCount // Include pending count in each record (optional)
      };
    });

    // Save to database
    await VerificationUpload.bulkCreate(categorizedLinks);
    fs.unlinkSync(filePath);

    res.json({
      message: 'Links categorized successfully',
      uniqueId,
      fileName: req.file.originalname,
      totalLinks: links.length,
      pendingCount, // Send pending count in response
      categorizedLinks: categorizedLinks.map(l => ({
        link: l.link,
        remark: l.remark
      })),
      date: new Date().toISOString(),
      nextStep: 'confirm'
    });

  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});


const VerificationTemp = require('./model/verification_temp');

app.post('/process-matching/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const email = req.headers['user-email'];

    if (!email) return res.status(400).json({ error: "Email required" });

    const pendingLinks = await VerificationUpload.findAll({
      where: { uniqueId, email, remark: 'pending' }
    });

    let insertedCount = 0;
    let updatedCount = 0;

    for (const linkRecord of pendingLinks) {
      let cleanedLink = linkRecord.link
        .trim()
        .replace(/^(https?:\/\/)?(www\.)?/i, 'https://www.') // ensure https://www.
        .replace(/linkedin\.com\/+in\/+/i, 'linkedin.com/in/') // normalize /in/
        .toLowerCase();

      // Remove trailing slashes before appending details
      cleanedLink = cleanedLink.replace(/\/+$/, '');

      // Ensure it ends with /details/experience/
      if (!cleanedLink.includes('/details/experience/')) {
        cleanedLink = `${cleanedLink}/details/experience/`;
      }

      // Update the clean_link in verification_upload table
      await VerificationUpload.update(
        { clean_link: cleanedLink },
        { where: { id: linkRecord.id } }
      );
      updatedCount++;

      // Insert into temp table including the link_id
      await VerificationTemp.create({
        uniqueId,
        clean_linkedin_link: cleanedLink,
        link_id: linkRecord.link_id, // Add this line to include the link_id
        remark: 'pending',
        // Add all the additional fields from verification_upload
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

    res.json({
      message: 'Processed and updated links successfully',
      uniqueId,
      insertedCount,
      updatedCount,
      totalPending: pendingLinks.length,
      status: 'success'
    });

  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: err.message,
      status: 'error'
    });
  }
});




// Add this route for deducting credits
// In your backend route file (e.g., routes/api.js)
const CreditHistory = require('./model/CreditHistory');
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





app.get('/get-verification-links', async (req, res) => {
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





app.post('/api/deduct-credits_v', async (req, res) => {
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
      { creditsUsed: credits },
      { where: { uniqueId } }
    );

    res.json({ updatedCredits: user.credits });

  } catch (err) {
    console.error('Credit deduction error:', err);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});



// Add this to your backend routes (e.g., in your Express server)
app.delete('/api/delete-verification-uploads/:uniqueId', async (req, res) => {
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
app.get('/api/verification-uploads/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    const uploads = await VerificationUpload.findAll({
      where: { uniqueId },
      raw: true
    });

    if (!uploads || uploads.length === 0) {
      return res.status(404).json({ error: 'No data found for this uniqueId' });
    }

    res.json(uploads);
  } catch (error) {
    console.error('Error fetching verification uploads:', error);
    res.status(500).json({ error: 'Failed to fetch verification data' });
  }
});






app.post('/sync-temp-to-main/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    // Get all records from temp table for this uniqueId
    const tempRecords = await VerificationTemp.findAll({
      where: { uniqueId }
    });

    let updatedCount = 0;
    let skippedCount = 0;

    // Update verification_upload records with data from temp table
    for (const tempRecord of tempRecords) {
      // Find the matching record in verification_upload using both uniqueId and link_id
      const [updated] = await VerificationUpload.update(
        {
          // Profile information
          full_name: tempRecord.full_name,
          head_title: tempRecord.head_title,
          head_location: tempRecord.head_location,
          title_1: tempRecord.title_1,
          company_1: tempRecord.company_1,
          company_link_1: tempRecord.company_link_1,
          exp_duration: tempRecord.exp_duration,
          exp_location: tempRecord.exp_location,
          job_type: tempRecord.job_type,
          title_2: tempRecord.title_2,
          company_2: tempRecord.company_2,
          company_link_2: tempRecord.company_link_2,
          exp_duration_2: tempRecord.exp_duration_2,
          exp_location_2: tempRecord.exp_location_2,
          job_type_2: tempRecord.job_type_2,
          final_remarks: tempRecord.final_remarks,
          list_contacts_id: tempRecord.list_contacts_id,
          url_id: tempRecord.url_id,
          
          // Link information
          clean_link: tempRecord.clean_linkedin_link,
          remark: tempRecord.remark,
          
          // Mark as synced
          last_sync: new Date()
        },
        { 
          where: { 
            uniqueId,
            link_id: tempRecord.link_id // Match by link_id instead of URL
          } 
        }
      );

      if (updated > 0) {
        updatedCount++;
      } else {
        skippedCount++;
        console.warn(`No matching record found for link_id: ${tempRecord.link_id}`);
      }
    }

    res.json({
      success: true,
      message: `Sync completed - Updated ${updatedCount} records, skipped ${skippedCount}`,
      uniqueId,
      updatedCount,
      skippedCount,
      totalRecords: tempRecords.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync temp data to main table',
      details: error.message
    });
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

const axios = require('axios');
// Scheduled sync job
function setupScheduledSync() {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running scheduled sync from temp to main table...');
      
      const uniqueIds = await VerificationTemp.findAll({
        attributes: ['uniqueId'],
        group: ['uniqueId'],
        raw: true
      });

      for (const { uniqueId } of uniqueIds) {
        try {
          const response = await axios.post(
            `http://3.109.203.132:8000/sync-temp-to-main/${uniqueId}`
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

setupScheduledSync();









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