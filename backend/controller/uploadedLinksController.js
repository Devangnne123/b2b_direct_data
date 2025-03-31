const { Sequelize } = require("sequelize");
const UploadedLink = require("../model/uploadedLinksModel");
const MobileEnrichment = require("../model/mobileEnrichmentModel");
const TempMobileData = require("../model/tempMobileDataModel");
const sequelize = require("../config/db");

exports.saveLinks = async (req, res) => {
  try {
    const { userEmail, links } = req.body;

    if (!userEmail || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    // Generate a unique upload ID for this session
    const uploadId = Date.now(); // Or use a UUID generator


    const linkObjects = links.map((link) => ({
      user_email: userEmail,
      linkedin_link: link,
      upload_id: uploadId, // Add the upload ID
    }));

    // Bulk insert while ignoring duplicates using updateOnDuplicate
    await UploadedLink.bulkCreate(linkObjects, {
      updateOnDuplicate: ["user_email", "linkedin_link"],
    });

    // SQL Queries to clean and categorize links
    const cleanQuery = `
      UPDATE "uploaded_links"
      SET linkedin_link_remark = 
          CASE 
              WHEN linkedin_link LIKE '%linkedin.com/in/ACw%' OR linkedin_link LIKE '%linkedin.com/in/acw%' 
              OR linkedin_link LIKE '%linkedin.com/in/ACo%' OR linkedin_link LIKE '%linkedin.com/sales/lead/ACw%' 
              OR linkedin_link LIKE '%linkedin.com/sales/people/ACw%' OR linkedin_link LIKE '%linkedin.com/sales/people/acw%' 
              OR linkedin_link LIKE '%linkedin.com/sales/people/AC%' THEN 'Sales Navigator Link'
              
              WHEN linkedin_link LIKE '%linkedin.com/company%' THEN 'Company Link'
              
              WHEN linkedin_link LIKE '%linkedin.com/pub/%' THEN 'Old_link_check'
              
              WHEN (linkedin_link NOT LIKE '%linkedin.com/in/%' AND linkedin_link NOT LIKE '%Linkedin.Com/In/%' 
              AND linkedin_link NOT LIKE '%linkedin.com//in/%') THEN 'Junk Link'
              
              ELSE 'ok'
          END;

      UPDATE "uploaded_links"
      SET clean_linkedin_link = linkedin_link
      WHERE (linkedin_link_remark IS NULL OR linkedin_link_remark = '' OR linkedin_link_remark = 'ok');

      UPDATE "uploaded_links"
      SET clean_linkedin_link = REPLACE(clean_linkedin_link, 'Linkedin.Com/In/', 'linkedin.com/in/')
      WHERE clean_linkedin_link LIKE '%Linkedin.Com/In/%';

      UPDATE "uploaded_links"
      SET clean_linkedin_link = REPLACE(clean_linkedin_link, 'linkedin.com//in/', 'linkedin.com/in/')
      WHERE clean_linkedin_link LIKE '%linkedin.com//in/%';
    `;

    await sequelize.query(cleanQuery, { type: Sequelize.QueryTypes.UPDATE });

    // Match `clean_linkedin_link` with `mobile_enrichments.linkedin_url` and fetch ID & Mobile Number
    const matchQuery = `
      UPDATE "uploaded_links" a
      SET mobile_number = b.mobile_1
      FROM "MobileEnrichments" b
      WHERE a.clean_linkedin_link = b.linkedin_url 
      AND a.mobile_number IS NULL 
      AND a.linkedin_link_remark = 'ok';
    `;

    await sequelize.query(matchQuery, { type: Sequelize.QueryTypes.UPDATE });

    // Update enrichment status
    const statusQuery = `
      UPDATE "uploaded_links"
      SET enrichment_status = 
          CASE 
              WHEN mobile_number IS NOT NULL THEN 'mobile_available' 
              ELSE 'mobile_not_available' 
          END;
    `;

    await sequelize.query(statusQuery, { type: Sequelize.QueryTypes.UPDATE });

    // Insert remaining links with "mobile_not_available" status into `temp_mobile_data`
    const insertTempDataQuery = `
      INSERT INTO "temp_mobile_data" (uploaded_link_id, linkedin_link, "createdAt", "updatedAt")
      SELECT id, clean_linkedin_link, NOW(), NOW()
      FROM "uploaded_links"
      WHERE enrichment_status = 'mobile_not_available' 
      AND clean_linkedin_link IS NOT NULL
      ON CONFLICT (uploaded_link_id) DO NOTHING;
    `;

    await sequelize.query(insertTempDataQuery, {
      type: Sequelize.QueryTypes.INSERT,
    });

    // Count total uploaded links
    const totalLinksQuery = `SELECT COUNT(*) AS total_uploaded_links FROM "uploaded_links";`;
    const totalLinksResult = await sequelize.query(totalLinksQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // Count links with available mobile numbers
    const availableMobileQuery = `SELECT COUNT(*) AS available_mobile_numbers FROM "uploaded_links" WHERE mobile_number IS NOT NULL;`;
    const availableMobileResult = await sequelize.query(availableMobileQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });

    res.status(201).json({
      message:
        "Links processed successfully, unmatched links moved to temp_mobile_data",
      total_uploaded_links: totalLinksResult[0].total_uploaded_links,
      available_mobile_numbers:
        availableMobileResult[0].available_mobile_numbers,
              upload_id: uploadId, // Return the upload ID

    });
  } catch (error) {
    console.error("Error saving links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLinkCounts = async (req, res) => {
  try {
    const { userEmail } = req.query;

    //  Check if userEmail is provided
    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required" });
    }

    // 1. Get all previously uploaded links for the user
    const previousLinksQuery = `
      SELECT clean_linkedin_link FROM "uploaded_links" WHERE user_email = :userEmail;
    `;
    const previousLinksResult = await sequelize.query(previousLinksQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { userEmail: userEmail },
    });
    const previousLinks = previousLinksResult.map(
      (item) => item.clean_linkedin_link
    );

    // 2.  Get total uploaded links for the user
    const totalLinksQuery = `
      SELECT COUNT(*) AS total_uploaded_links 
      FROM "uploaded_links" 
      WHERE user_email = :userEmail;
    `;
    const totalLinksResult = await sequelize.query(totalLinksQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { userEmail: userEmail },
    });
    const totalUploadedLinks = totalLinksResult[0].total_uploaded_links;

    // 3. Count links with available mobile numbers for the user
    const availableMobileQuery = `
      SELECT COUNT(*) AS available_mobile_numbers 
      FROM "uploaded_links" 
      WHERE user_email = :userEmail AND mobile_number IS NOT NULL;
    `;
    const availableMobileResult = await sequelize.query(availableMobileQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { userEmail: userEmail },
    });
    const availableMobileNumbers =
      availableMobileResult[0].available_mobile_numbers;

    // 4.  Calculate new and duplicate links (This part needs adjustment based on how you track "new" links)
    //    For demonstration, let's assume you have a way to know which links were uploaded in the current batch.
    //    In a real scenario, you might need to store this information or compare with previous uploads.
    //    Here's a placeholder:
    const newLinksCount = 0; // Replace with your logic to count new links
    const duplicateLinksCount = 0; // Replace with your logic to count duplicate links

    res.status(200).json({
      total_uploaded_links: totalUploadedLinks,
      available_mobile_numbers: availableMobileNumbers,
      newLinksCount: newLinksCount,
      duplicateLinksCount: duplicateLinksCount,
    });
  } catch (error) {
    console.error("Error fetching link counts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUploadedLinks = async (req, res) => {
  try {
    // Update uploaded_links with data from temp_mobile_data
    const updateQuery = `
      UPDATE uploaded_links a
      SET 
          mobile_number = b.mobile_number,
          mobile_number_2 = b.mobile_number_2,
          person_name = b.person_name,
          person_location = b.person_location,
          linkedin_link_remark = 'ok'
      FROM temp_mobile_data b
      WHERE a.id = b.uploaded_link_id
      AND a.enrichment_status = 'mobile_not_available';
    `;

    await sequelize.query(updateQuery, { type: Sequelize.QueryTypes.UPDATE });

    // Update enrichment_status to 'mobile_available' where mobile_number_1 is now present
    const statusUpdateQuery = `
      UPDATE uploaded_links 
      SET enrichment_status = 'mobile_available' 
      WHERE enrichment_status = 'mobile_not_available' 
      AND mobile_number IS NOT NULL;
    `;

    await sequelize.query(statusUpdateQuery, {
      type: Sequelize.QueryTypes.UPDATE,
    });

    // Fetch and count records by enrichment_status
    const countQuery = `
      SELECT enrichment_status, COUNT(enrichment_status) AS count 
      FROM uploaded_links 
      GROUP BY enrichment_status;
    `;

    const enrichmentCounts = await sequelize.query(countQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
      message: "Uploaded links updated successfully from temp_mobile_data",
      enrichmentCounts,
    });
  } catch (error) {
    console.error("Error updating uploaded links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllUploadedLinks = async (req, res) => {
  try {
    const uploadedLinks = await UploadedLink.findAll();

    if (!uploadedLinks || uploadedLinks.length === 0) {
      return res.status(404).json({ error: "No uploaded links found" });
    }

    res.status(200).json({
      message: "All uploaded links fetched successfully",
      data: uploadedLinks,
    });
  } catch (error) {
    console.error("Error fetching all uploaded links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
