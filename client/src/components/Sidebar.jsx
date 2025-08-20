import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMdSettings } from "react-icons/io";
import {
  FaChevronDown,
  FaChevronUp,
  FaUserPlus,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "../css/Sidebar.css";

function Sidebar() {
  const [expandedItem, setExpandedItem] = useState(null);
  const [userEmail, setUserEmail] = useState("Loading...");
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const navigate = useNavigate();

  // Get user & roleId early
  const user = JSON.parse(sessionStorage.getItem("user"));
  const roleId = user?.roleId;
   const token = sessionStorage.getItem("token");
    let inactivityTimer;

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("Guest");
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  
  

  // Logout function (same as yours)
// Logout function (without useCallback)
const handleLogout = async () => {
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  const token = sessionStorage.getItem("token");

  if (!user || !token) return;

  try {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ email: user.email }),
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear storage and notify other tabs
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("logout-event", Date.now().toString());
    navigate("/");
  }
};


const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    handleLogout(); // Auto-logout after 24h 
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
};

  // Set up event listeners for user activity
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initialize timer on app load
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [resetInactivityTimer]);

  // Handle session sync across tabs (existing code)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "logout-event") {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


  const adminMenuItems = [
    {
      name: "Direct Number Enrichment",
      icon: <FaUserPlus />,
      options: [{ name: "Bulk Lookup", path: "/bulk-lookup" }],
    },
    {
      name: "Linkedin Contact Verification",
      icon: <FaUserPlus />,
      options: [{ name: "Upload contact Link", path: "/verfication_links" }],
    },
    {
      name: "Linkedin Company Details",
      icon: <FaUserPlus />,
      options: [{ name: "Upload Company link", path: "/verfication_com" }],
    },
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [
        { name: "Add User", path: "/add-user" },
        { name: "User Lists", path: "/user-list" },
        { name: "Reset Password", path: "/change_your_password" },
        { 
          name: "Sign out", 
          path: "#",
          onClick: handleLogout,
          icon: <FaSignOutAlt className="logout-icon" />
        },
      ],
    },
    {
      name: "Statistics",
      icon: <FaChartBar />,
      options: [
        { name: "Credit Reports", path: "/user-credit-report" },
        { name: "All report", path: "/all_history" }
      ]
    },
  ];

  const userMenuItems = [
    {
      name: "Direct Number Enrichment",
      icon: <FaUserPlus />,
      options: [{ name: "Bulk Lookup", path: "/bulk-lookup" }],
    },
    {
      name: "Linkedin Contact Verification",
      icon: <FaUserPlus />,
      options: [{ name: "Upload contact Link", path: "/verfication_links" }],
    },
    {
      name: "Linkedin Company Details",
      icon: <FaUserPlus />,
      options: [{ name: "Upload Company link", path: "/verfication_com" }],
    },
    {
      name: "Statistics",
      icon: <FaChartBar />,
      options: [
        { name: "Credit Reports", path: "/user-credit-report" },
        { name: "All report", path: "/all_history" }
      ],
    },
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [{
        name: "Sign out", 
        path: "#",
        onClick: handleLogout,
        icon: <FaSignOutAlt className="logout-icon" />
      }],
    },
  ];

  const report = [
    {
      name: "Statistics",
      icon: <FaChartBar />,
      options: [
        { name: "All report", path: "/all_history" },
        { name: "All Status Report", path: "/all_completed_report" }
      ],
    },
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [{
        name: "Sign out", 
        path: "#",
        onClick: handleLogout,
        icon: <FaSignOutAlt className="logout-icon" />
      }],
    },
  ];

  const superAdminItems = [
    {
      name: "Statistics",
      icon: <FaChartBar />,
      options: [
        { name: "All report", path: "/all-admin" }
        
      ],
    },
    {
      name: "All User",
      icon: <FaChartBar />,
      options: [
        { name: "All User", path: "/all-user" }
        
      ],
    },
    {
      name: "Credit Report",
      icon: <FaChartBar />,
      options: [
        { name: "Credit Report", path: "/admin-credit-report" }
       
      ],
    },
    {
      name: "All Report",
      icon: <FaChartBar />,
      options: [
        { name: "All Report", path: "/all_history" },
       
      ],
    },
    {
      name: "All Status Report",
      icon: <FaChartBar />,
      options: [
       
        { name: "All Status Report", path: "/all_completed_report" }
      ],
    },
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [{
        name: "Sign out", 
        path: "#",
        onClick: handleLogout,
        icon: <FaSignOutAlt className="logout-icon" />
      }],
    },
   
  ];

  const menuItems =
    roleId === 1 ? adminMenuItems :
    roleId === 2 ? userMenuItems :
    roleId === 123 ? report :
    roleId === 3 ? superAdminItems : [];

  return (
    <aside className={`sidebar-container ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="sidebar-toggle"
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      
      <div className="sidebar-user-info">
        <FaUsers className="sidebar-avatar" />
        {!isCollapsed && <p className="sidebar-user-email">{userEmail}</p>}
        {!isCollapsed && <img className="sidebar-brand-logo" src="new.png" alt="" />}
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={item.name} className="sidebar-menu-item">
            <button
              onClick={() => {
                if (item.path === "#") return; // Skip for sign out which has its own handler
                setExpandedItem(expandedItem === index ? null : index);
              }}
              className="sidebar-menu-button"
            >
              <span className="sidebar-menu-icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="sidebar-menu-text">{item.name}</span>
              )}
              {!isCollapsed && item.options && (
                <span className="sidebar-expand-icon">
                  {expandedItem === index ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </button>
            {!isCollapsed && expandedItem === index && item.options && (
              <div className="sidebar-submenu">
                {item.options.map((option, optIndex) => (
                  option.onClick ? (
                    <button
                      key={optIndex}
                      onClick={option.onClick}
                      className="sidebar-submenu-item"
                    >
                      {option.icon && <span className="submenu-icon">{option.icon}</span>}
                      {option.name}
                    </button>
                  ) : (
                    <Link
                      key={optIndex}
                      to={option.path}
                      className="sidebar-submenu-item"
                    >
                      {option.name}
                    </Link>
                  )
                ))}
              </div>
            )}
          </li>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;