import { useState, useEffect } from "react";
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
  name: "Top-Up Credits",
  icon: <FaUserPlus />,
  options: roleId === 1 ? [{ name: "Checkout", path: "/checkout" }] : [],
}
,
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [
        { name: "Add User", path: "/add-user" },
        { name: "User Lists", path: "/user-list" },
        { name: "Sign out", path: "/" },
      ],
    },
    {
      name: "Statistics",
      icon: <FaChartBar />,
      options: [{ name: "Credit Reports", path: "/user-credit-report" }],
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
      options: [{ name: "Credit Reports", path: "/user-credit-report" }],
    },
    {
      name: "Settings",
      icon: <IoMdSettings />,
      options: [{ name: "Sign out", path: "/" }],
    },
  ];

  const superAdminItems = [
    { name: "All Admin", path: "/all-admin", icon: <FaChartBar /> },
    { name: "All User", path: "/all-user", icon: <FaChartBar /> },
    { name: "Credit Report", path: "/admin-credit-report", icon: <FaChartBar /> },
    { name: "Sign out", path: "/", icon: <FaChartBar /> },
  ];

  const menuItems =
    roleId === 1 ? adminMenuItems :
    roleId === 2 ? userMenuItems :
    roleId === 3 ? superAdminItems : [];

  const handleMenuClick = (menuItem) => {
    if (menuItem === "Sign out") {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("roleId");
      navigate("/");
    }
  };

  return (
    <aside className={`menu-container ${isCollapsed ? "collapsed" : ""}`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="toggle-button">
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      <div className="user-info">
        <FaUsers className="avatar" />
        {!isCollapsed && <p className="e">{userEmail}</p>}
        {!isCollapsed && <img className="b2b" src="new.png" alt="" />}
      </div>
      <nav className="menu">
        {menuItems.map((item, index) => (
          <li key={item.name} className="menu-item">
            <button
              onClick={() => {
                setExpandedItem(expandedItem === index ? null : index);
                handleMenuClick(item.name);
              }}
              className="menu-button"
            >
              {item.icon}
              {!isCollapsed &&
                (item.path ? (
                  <Link to={item.path} className="menu-link">
                    {item.name}
                  </Link>
                ) : (
                  item.name
                ))}
              {!isCollapsed && item.options && (
                expandedItem === index ? (
                  <FaChevronUp className="expand-icon" />
                ) : (
                  <FaChevronDown className="expand-icon" />
                )
              )}
            </button>
            {!isCollapsed && expandedItem === index && item.options && (
              <div className="submenu">
                {item.options.map((option, optIndex) => (
                  <Link key={optIndex} to={option.path} className="submenu-button">
                    {option.name}
                  </Link>
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
