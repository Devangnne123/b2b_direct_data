import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/ProfileLookup.css";

const Sidebar = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = sessionStorage.getItem("roleId");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    console.log("Fetched user:", user);
    
    if (user && user.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("Guest");
      console.log("User data not found or incomplete.");
    }
  }, []);

  // Function to toggle the expanded/collapsed state of menu sections
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const adminMenuItems = [
    {
      section: "Lookup",
      items: [
        { name: "Profile Lookup", path: "/profile-lookup" },
        { name: "Bulk Lookup", path: "/bulk-lookup" },
      ],
    },
    {
      section: "Settings",
      items: [
        { name: "Add User", path: "/add-user" },
        { name: "User Lists", path: "/user-list" },
        { name: "Sign out" },
      ],
    },
    {
      section: "Statistics",
      items: [
        { name: "Lookup Statistics", path: "/UserStatistics" },
        { name: "Credit Reports", path: "/user-credit-report" },
        { name: "User Statistics", path: "/statistic" },
      ],
    },
  ];

  const userMenuItems = [
    { name: "Profile Lookup", path: "/profile-lookup" },
    { name: "Bulk Lookup", path: "/bulk-lookup" },
    { name: "User Statistics", path: "/UserStatistics" },
    { name: "Credit Reports", path: "/user-credit-report" },
    { name: "Sign out" },
  ];

  const superAdminItems = [
    { name: "All Admins", path: "/all-admin" },
    { name: "All Users", path: "/all-user" },
    { name: "All User Statistics", path: "/all-user-statistics" },
    { name: "Credit Reports", path: "/admin-credit-report" },
    { name: "Sign out" },
  ];

  const menuItems =
    roleId === "1" ? adminMenuItems :
    roleId === "2" ? userMenuItems :
    roleId === "3" ? superAdminItems :
    [];

  const handleMenuClick = (menuItem) => {
    if (menuItem === "Sign out") {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("roleId");
      navigate("/login");
    }
  };

  return (
    <aside className="sidebar">
      <div className="user-info">
        <div className="avatar-container">
          <img src="/profile.png" alt="Profile" className="avatar" />
        </div>
        <p>{userEmail ? userEmail : "Loading..."}</p>
      </div>
      <nav className="menu">
        <ul>
          {roleId === "1" &&
            adminMenuItems.map((section) => (
              <li key={section.section}>
                <div
                  className="menu-section"
                  onClick={() => toggleSection(section.section)}
                >
                  {section.section}{" "}
                  <span className="arrow">
                    {expandedSections[section.section] ? "▲" : "▼"}
                  </span>
                </div>
                {expandedSections[section.section] && (
                  <ul className="submenu">
                    {section.items.map((item) => (
                      <li
                        key={item.name}
                        onClick={() => handleMenuClick(item.name)}
                        className={
                          item.path === location.pathname
                            ? "menu-item active"
                            : "menu-item"
                        }
                      >
                        {item.path ? (
                          <Link to={item.path} className="menu-link">
                            {item.name}
                          </Link>
                        ) : (
                          <span className="menu-link">{item.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}

          {(roleId === "2" || roleId === "3") &&
            menuItems.map((item) => (
              <li
                key={item.name}
                onClick={() => handleMenuClick(item.name)}
                className={
                  item.path === location.pathname ? "menu-item active" : "menu-item"
                }
              >
                {item.path ? (
                  <Link to={item.path} className="menu-link">
                    {item.name}
                  </Link>
                ) : (
                  <span className="menu-link">{item.name}</span>
                )}
              </li>
            ))}
        </ul>
      </nav>
      {roleId === "1" && (
        <div className="start-plan">
          <h3>Start Your Plan</h3>
          <p>
            Upgrade your plan to unlock additional features and access more credits.
          </p>
          <button>Upgrade</button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
