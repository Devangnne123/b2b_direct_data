const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UploadedLink = sequelize.define("uploaded_links", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  linkedin_link: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  linkedin_link_remark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clean_linkedin_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  linkedin_url_id: {
    type: DataTypes.UUID,
    allowNull: true, // Stores the matched ID from MobileEnrichment
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: true, // Stores the fetched mobile number if matched
  },
  mobile_number_2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  person_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  person_location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enrichment_status: {
    type: DataTypes.STRING,
    allowNull: true, // New column for tracking enrichment status
  }
},
{
    timestamps:true,
}
);

module.exports = UploadedLink;
