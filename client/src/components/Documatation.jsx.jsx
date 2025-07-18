import React from 'react';
import '../css/Documentation.css'; // Create this CSS file for styling

const UserRegistrationDocumentation = () => {
  return (
    <div className="documentation-container">
      <h1>User Registration and Data Storage Documentation</h1>
      
      <section className="section">
        <h2>User Signup Flow</h2>
        
        <div className="subsection">
          <h3>Signup Form Submission</h3>
          <ul>
            <li>User provides:
              <ul>
                <li>Email address</li>
                <li>Password (8-100 characters)</li>
                <li>Company name</li>
                <li>Phone number</li>
              </ul>
            </li>
            <li>System validates all fields in real-time</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Server-Side Processing</h3>
          <ul>
            <li>Email is stored</li>
            <li>Password is hashed (never stored in plain text)</li>
            <li>Client ID is automatically generated</li>
            <li>Default credits (0) are assigned</li>
            <li>Role ID is set to 2 (regular user) by default</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Database Storage Example</h3>
          <pre className="code-block">
            {`{
  userEmail: "user@example.com", // converted to lowercase
  userPassword: "$2a$10$N9qo8uLOickgx2ZMRZoMy...", // bcrypt hash
  companyName: "Acme Corp",
  phoneNumber: "+15551234567",
  roleId: 2,
  credits: 0,
  clientId: "CLI-AB12CD34", // auto-generated
  isMainClient: true, // if this is the root account
  isActive: true,
  creditCostPerLink: 5,
  creditCostPerLink_V: 3
}`}
          </pre>
        </div>
      </section>
      
      <section className="section">
        <h2>Admin User Creation Flow</h2>
        
        <div className="subsection">
          <h3>Admin Dashboard Action</h3>
          <ul>
            <li>Superadmin (roleId=3) or Admin (roleId=1) creates new user</li>
            <li>Form includes role assignment capability</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Special Processing Example</h3>
          <pre className="code-block">
            {`{
  userEmail: "employee@example.com",
  userPassword: "$2a$10$N9qo8uLOickgx2ZMRZoMy...",
  companyName: "Acme Corp",
  roleId: 1, // admin role
  createdBy: "superadmin@company.com", // creator's email
  clientId: "CLI-AB12CD34EF56GH78", // includes parent client ID portion
  isMainClient: false // sub-account
}`}
          </pre>
        </div>
      </section>
      
      <section className="section">
        <h2>Data Validation Rules</h2>
        
        <div className="subsection">
          <h3>Email Validation</h3>
          <ul>
            <li>Must be valid email format</li>
            <li>Automatically converted to lowercase</li>
            <li>Unique across system</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Password Requirements</h3>
          <ul>
            <li>Minimum 8 characters</li>
            <li>Maximum 100 characters</li>
            <li>Stored as bcrypt hash</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Phone Number Formatting</h3>
          <ul>
            <li>Valid international format</li>
            <li>Stored with country code (+XX)</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Credit Management</h3>
          <ul>
            <li>Default cost: 5 credits/regular link</li>
            <li>Verified link cost: 3 credits</li>
            <li>Credits cannot go negative</li>
          </ul>
        </div>
      </section>
      
      <section className="section">
        <h2>Security Features</h2>
        
        <div className="subsection">
          <h3>OTP Protection</h3>
          <ul>
            <li>ResetPasswordOtp: 6-digit code</li>
            <li>Expires after 15 minutes (ResetPasswordOtpExpiry)</li>
            <li>Lockout after 5 failed attempts (otpAttempts)</li>
            <li>30-minute lock (otpBlockedUntil) on too many attempts</li>
          </ul>
        </div>
        
        <div className="subsection">
          <h3>Account Status</h3>
          <ul>
            <li>isActive: Can be deactivated without deletion</li>
            <li>Soft delete: deletedAt timestamp instead of hard deletion</li>
          </ul>
        </div>
      </section>
      
      <section className="section">
        <h2>Client Hierarchy System</h2>
        
        <div className="subsection">
          <h3>Main Clients Example</h3>
          <pre className="code-block">
            {`{
  isMainClient: true,
  clientId: "CLI-AB12CD34" // 8-character ID
}`}
          </pre>
        </div>
        
        <div className="subsection">
          <h3>Sub-Clients Example</h3>
          <pre className="code-block">
            {`{
  isMainClient: false,
  clientId: "CLI-AB12CD34EF56GH78", // Parent ID + extension
  createdBy: "mainclient@example.com"
}`}
          </pre>
        </div>
      </section>
      
      <section className="section">
        <h2>Timestamps and Tracking</h2>
        
        <div className="subsection">
          <h3>Automatic Fields</h3>
          <ul>
            <li>createdAt: When account was made</li>
            <li>updatedAt: Last modification time</li>
            <li>lastLogin: Updated on each successful auth</li>
            <li>deletedAt: Set when account is soft-deleted</li>
          </ul>
        </div>
      </section>

      <section className="section">
        <h2>Database Schema</h2>
        
        <div className="subsection">
          <h3>Users Table Structure</h3>
          <div className="table-container">
            <table className="schema-table">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Constraints</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>id</td>
                  <td>INTEGER (Auto-increment)</td>
                  <td>Primary Key</td>
                  <td>Unique identifier for each user</td>
                </tr>
                <tr>
                  <td>userEmail</td>
                  <td>STRING</td>
                  <td>NOT NULL, UNIQUE, Email validation</td>
                  <td>User's email address (stored in lowercase)</td>
                </tr>
                <tr>
                  <td>userPassword</td>
                  <td>STRING</td>
                  <td>NOT NULL, Length validation (8-100 chars)</td>
                  <td>Hashed user password</td>
                </tr>
                <tr>
                  <td>companyName</td>
                  <td>STRING</td>
                  <td>Not empty validation</td>
                  <td>Name of the user's company</td>
                </tr>
                <tr>
                  <td>phoneNumber</td>
                  <td>STRING</td>
                  <td>Phone number format validation</td>
                  <td>User's contact phone number</td>
                </tr>
                <tr>
                  <td>roleId</td>
                  <td>INTEGER</td>
                  <td>NOT NULL, Default: 2</td>
                  <td>User role (3: superadmin, 2: regular user, 1: admin)</td>
                </tr>
                <tr>
                  <td>createdBy</td>
                  <td>STRING</td>
                  <td>Email validation</td>
                  <td>Email of user who created this account</td>
                </tr>
                <tr>
                  <td>resetPasswordOtp</td>
                  <td>STRING</td>
                  <td>NULL allowed</td>
                  <td>OTP for password reset</td>
                </tr>
                <tr>
                  <td>resetPasswordOtpExpiry</td>
                  <td>DATETIME</td>
                  <td>NULL allowed</td>
                  <td>Expiry time for OTP</td>
                </tr>
                <tr>
                  <td>otpAttempts</td>
                  <td>INTEGER</td>
                  <td>Default: 0</td>
                  <td>Count of failed OTP attempts</td>
                </tr>
                <tr>
                  <td>otpBlockedUntil</td>
                  <td>DATETIME</td>
                  <td>NULL allowed</td>
                  <td>Time until OTP attempts are blocked</td>
                </tr>
                <tr>
                  <td>creditCostPerLink</td>
                  <td>INTEGER</td>
                  <td>Default: 5, Min: 1</td>
                  <td>Credit cost per regular link</td>
                </tr>
                <tr>
                  <td>creditCostPerLink_V</td>
                  <td>INTEGER</td>
                  <td>Default: 3, Min: 1</td>
                  <td>Credit cost per verified link</td>
                </tr>
                <tr>
                  <td>credits</td>
                  <td>INTEGER</td>
                  <td>Default: 0, Min: 0</td>
                  <td>User's available credits</td>
                </tr>
                <tr>
                  <td>clientId</td>
                  <td>STRING</td>
                  <td>NOT NULL, UNIQUE</td>
                  <td>Unique client identifier</td>
                </tr>
                <tr>
                  <td>isMainClient</td>
                  <td>BOOLEAN</td>
                  <td>Default: false</td>
                  <td>Flag for main client accounts</td>
                </tr>
                <tr>
                  <td>isActive</td>
                  <td>BOOLEAN</td>
                  <td>Default: true</td>
                  <td>Account active status</td>
                </tr>
                <tr>
                  <td>lastLogin</td>
                  <td>DATETIME</td>
                  <td>NULL allowed</td>
                  <td>Timestamp of last login</td>
                </tr>
                <tr>
                  <td>createdAt</td>
                  <td>DATETIME</td>
                  <td>Auto-generated</td>
                  <td>Record creation timestamp</td>
                </tr>
                <tr>
                  <td>updatedAt</td>
                  <td>DATETIME</td>
                  <td>Auto-generated</td>
                  <td>Record update timestamp</td>
                </tr>
                <tr>
                  <td>deletedAt</td>
                  <td>DATETIME</td>
                  <td>NULL allowed</td>
                  <td>Soft deletion timestamp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      
        {/* New Direct Number Enrichment Section */}
      <section className="section">
        <h2>Direct Number Enrichment</h2>
        
        <div className="subsection">
          <h3>Excel File Upload Process</h3>
          <p>When users upload an Excel file in the Direct Number Enrichment section, the system processes and stores the data with the following structure:</p>
          
          <div className="code-block">
            <pre>{`const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Link = sequelize.define('Link', {
  // Model definition shown above
}, {
  tableName: 'web_direct_number_main',
  timestamps: false,
});`}</pre>
          </div>
        </div>

        <div className="subsection">
          <h3>Data Storage Structure</h3>
          <div className="table-container">
            <table className="schema-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>uniqueId</td>
                  <td>UUID</td>
                  <td>Yes</td>
                  <td>UUIDV4</td>
                  <td>Unique identifier for each record</td>
                </tr>
                <tr>
                  <td>credits</td>
                  <td>INTEGER</td>
                  <td>No</td>
                  <td>0</td>
                  <td>Credits associated with this link</td>
                </tr>
                <tr>
                  <td>link</td>
                  <td>STRING</td>
                  <td>Yes</td>
                  <td>-</td>
                  <td>Original URL submitted by user</td>
                </tr>
                {/* Add all other fields in the same pattern */}
                <tr>
                  <td>status</td>
                  <td>STRING</td>
                  <td>No</td>
                  <td>'not available'</td>
                  <td>Current processing status</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="subsection">
          <h3>Excel File Processing Flow</h3>
          <ol className="process-flow">
            <li>
              <strong>File Upload</strong>
              <ul>
                <li>User uploads Excel file containing LinkedIn URLs</li>
                <li>System validates file format and content</li>
              </ul>
            </li>
            <li>
              <strong>Data Extraction</strong>
              <ul>
                <li>Each row is processed to extract LinkedIn URL (stored in link and totallink)</li>
                <li>Optional additional data (name, location, etc.)</li>
              </ul>
            </li>
            <li>
              <strong>Data Enrichment</strong>
              <ul>
                <li>System attempts to find matching contact information</li>
                <li>Results stored in mobile_number, mobile_number_2, person_name, person_location</li>
              </ul>
            </li>
            <li>
              <strong>Credit Handling</strong>
              <ul>
                <li>Credits deducted based on results found</li>
                <li>Values recorded in creditDeducted and remainingCredits</li>
              </ul>
            </li>
            <li>
              <strong>Status Tracking</strong>
              <ul>
                <li>Each record receives a status</li>
                <li>'pending' - Initial state</li>
                <li>'processing' - During enrichment</li>
                <li>'completed' - Successful enrichment</li>
                <li>'failed' - If enrichment failed</li>
                <li>'not available' - Default state</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="subsection">
          <h3>Frontend Display Example</h3>
          <div className="code-block">
            <pre>{`import React from 'react';
import { Table } from 'antd';

const LinkResultsTable = ({ data }) => {
  const columns = [
    {
      title: 'Person Name',
      dataIndex: 'person_name',
      key: 'person_name',
    },
    {
      title: 'LinkedIn URL',
      dataIndex: 'clean_link',
      key: 'clean_link',
      render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>,
    },
    {
      title: 'Phone Number',
      dataIndex: 'mobile_number',
      key: 'mobile_number',
    },
    {
      title: 'Location',
      dataIndex: 'person_location',
      key: 'person_location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={\`status-badge \${status.toLowerCase().replace(' ', '-')}\`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Credits Used',
      dataIndex: 'creditDeducted',
      key: 'creditDeducted',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="uniqueId"
      pagination={{ pageSize: 10 }}
    />
  );
};

export default LinkResultsTable;`}</pre>
          </div>
        </div>

        <div className="subsection">
          <h3>Status Indicators</h3>
          <div className="table-container">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Description</th>
                  <th>UI Indicator</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="status-badge pending">pending</span></td>
                  <td>Waiting to be processed</td>
                  <td>Yellow badge</td>
                </tr>
                <tr>
                  <td><span className="status-badge processing">processing</span></td>
                  <td>Currently being enriched</td>
                  <td>Blue badge</td>
                </tr>
                {/* Add other status rows */}
              </tbody>
            </table>
          </div>
        </div>

        <div className="subsection">
          <h3>Credit Deduction Logic</h3>
          <ol className="credit-logic">
            <li>
              <strong>Successful enrichment</strong> (phone number found):
              <ul>
                <li>Deducts 5 credits (or configured amount)</li>
                <li>Updates creditDeducted and remainingCredits</li>
              </ul>
            </li>
            <li>
              <strong>Partial enrichment</strong> (some data found):
              <ul>
                <li>Deducts 3 credits (or configured amount)</li>
              </ul>
            </li>
            <li>
              <strong>No data found</strong>:
              <ul>
                <li>Deducts 1 credit (or configured amount)</li>
              </ul>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
};

export default UserRegistrationDocumentation;