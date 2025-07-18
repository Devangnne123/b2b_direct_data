 const Link = require('../model/Link');
 const express = require("express");
const User  = require('../model/userModel'); // Adjust path as needed
const fs = require('fs');

const xlsx= require('xlsx');
const path=require("path");
 // backend/server.js
 


 exports.getlinks_bulk = async (req, res) => {
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
  };







  // exports.UploadFile = async (req, res) => {
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
  // if (links.length > 1000) {
  //   return res.status(400).json({ message: "Max 10 links allowed" });
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
  // };
  






   exports.confirm_upload = async (req, res) => {
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
   };
  





   // File upload route that fetches and updates credits
exports.credit_deduct = async (req, res) => {
  const { userEmail, creditCost, uniqueId } = req.body;

  try {
    const user = await User.findOne({ where: { userEmail } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.credits < creditCost) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Deduct credits
    user.credits -= creditCost;
    await user.save();

    // Update Link entries with creditDeducted and remainingCredits
    await Link.update(
      {
        creditDeducted: creditCost,
        remainingCredits: user.credits, // Store remaining credits here
      },
      { where: { uniqueId } }
    );

    res.json({
      message: 'File uploaded, credits deducted and remaining credits stored.',
      updatedCredits: user.credits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};







  // Add this to your server routes
exports.cancel_upload = async (req, res) => {
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
};
  