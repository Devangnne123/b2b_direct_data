const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs

const VerificationUpload_com = sequelize.define('verification_upload_com', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => uuidv4() // Generate a random UUID as default
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  totallink: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pendingCount: {  // New field to track pending links
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clean_link: {
    type: DataTypes.TEXT
  },
  link_id: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: () => uuidv4(), // Generates a UUID like "550e8400-e29b-41d4-a716-446655440000"
    unique: true // Ensures uniqueness (optional)
  },
   date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  },
 emailSent: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false
},
emailSentAt: {
  type: DataTypes.DATE,
  allowNull: true
},
   final_status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending'
  },
  remainingCredits: {
    type: DataTypes.INTEGER, // <-- Add this field
    defaultValue: 0,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  creditsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Pending',
  },
   company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
   company_headquater: {
      type: DataTypes.STRING,
      allowNull: true
    },
   company_industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_size: {
      type: DataTypes.STRING,
      allowNull: true
    },
    employee_count: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year_founded: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_speciality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_stock_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verified_page_date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_followers: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location_total: {
      type: DataTypes.STRING,
      allowNull: true
    },
    overview: {
      type: DataTypes.STRING,
      allowNull: true
    },
    visit_website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    final_remaks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    company_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  


    
  
}, {
  tableName: 'verification_uploads_com',
  timestamps: false




  
});

module.exports = VerificationUpload_com;