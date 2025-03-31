const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const UploadedLink = require("./uploadedLinksModel");

const TempMobileData = sequelize.define(
  "TempMobileData",
  {
    uploaded_link_id: {
      type: DataTypes.UUID, // Change to UUID to match uploaded_links.id
      allowNull: false,
      primaryKey: true,
      references: {
        model: UploadedLink,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    linkedin_link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile_number: {
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
      mobile_number_2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
  },
  {
    tableName: "temp_mobile_data",
    timestamps: true,
  }
);

module.exports = TempMobileData;
