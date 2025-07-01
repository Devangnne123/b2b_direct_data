const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const User = sequelize.define("User", {
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      notEmpty: {
        msg: 'Email cannot be empty'
      }
    }
  },
  userPassword: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8, 100],
        msg: 'Password must be between 8 and 100 characters'
      }
    }
  },
  companyName: {
    type: DataTypes.STRING,
    validate: {
      notEmpty: {
        msg: 'Company name cannot be empty'
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    validate: {
      is: {
        args: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
        msg: 'Please provide a valid phone number'
      }
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2 // Default role for regular users
  },
  createdBy: {
    type: DataTypes.STRING,
    validate: {
      isEmail: {
        msg: 'CreatedBy must be a valid email'
      }
    }
  },
  resetPasswordOtp: {
  type: DataTypes.STRING,
  allowNull: true
},
resetPasswordOtpExpiry: {
  type: DataTypes.DATE,
  allowNull: true
},
otpAttempts: {
  type: DataTypes.INTEGER,
  defaultValue: 0
},
otpBlockedUntil: {
  type: DataTypes.DATE,
  allowNull: true
},
  // In your User model definition
// In your User model definition
creditCostPerLink: {
  type: DataTypes.INTEGER,
  defaultValue: 5,
  allowNull: false,
  validate: {
    min: 1
  }
},
creditCostPerLink_V: {
  type: DataTypes.INTEGER,
  defaultValue: 3,
  allowNull: false,
  validate: {
    min: 1
  }
},
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Credits cannot be negative'
      }
    }
  },
  clientId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  isMainClient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
 
  timestamps: true,
  paranoid: true, // Enables soft deletion
  hooks: {
    beforeValidate: async (user, options) => {
      if (user.userEmail) {
        user.userEmail = user.userEmail.toLowerCase().trim();
      }

      const generateIdSegment = (length) => {
        return uuidv4().replace(/-/g, '').substr(0, length).toUpperCase();
      };

      if (!user.clientId) {
        try {
          if (!user.createdBy) {
            // Main client
            user.clientId = generateIdSegment(8);
            user.isMainClient = true;
          } else {
            // Sub-client
            const creator = await User.findOne({
              where: { userEmail: user.createdBy },
              attributes: ['clientId'],
              transaction: options?.transaction
            });

            if (!creator) {
              throw new Error('Creator user not found');
            }

            user.clientId = `${creator.clientId.substr(0, 8)}${generateIdSegment(8)}`;
          }
        } catch (error) {
          console.error('Client ID generation failed:', error);
          user.clientId = `CLI-${generateIdSegment(12)}`;
          throw error;
        }
      }
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['clientId'],
      name: 'users_client_id_unique'
    },
    {
      fields: ['userEmail'],
      name: 'users_email_index'
    },
    {
      fields: ['createdBy'],
      name: 'users_created_by_index'
    },
    {
      fields: ['isMainClient'],
      name: 'users_main_client_index'
    }
  ]
});

// Safe index creation check
(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const indexes = await queryInterface.showIndex('Users');

    const requiredIndexes = [
      'users_client_id_unique',
      'users_email_index',
      'users_created_by_index',
      'users_main_client_index'
    ];

    for (const indexName of requiredIndexes) {
      if (!indexes.some(index => index.name === indexName)) {
        await queryInterface.addIndex('Users', {
          fields: [indexName.split('_').slice(1, -1).join('_')],
          name: indexName
        });
        console.log(`Created index: ${indexName}`);
      }
    }
  } catch (error) {
    console.error('Index verification error:', error);
  }
})();

module.exports = User;
