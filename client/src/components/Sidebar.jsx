import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMdSettings } from "react-icons/io";
import { FaChevronDown, FaChevronUp, FaUserPlus, FaUsers, FaChartBar, FaFileAlt, FaSignOutAlt } from "react-icons/fa";
import "../css/Sidebar.css";

 function Sidebar() {
  const [expandedItem, setExpandedItem] = useState(null);
  const [userEmail, setUserEmail] = useState("Loading...");
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = sessionStorage.getItem("roleId");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("Guest");
    }
  }, []);

  const adminMenuItems = [
    { name: "Direct Number Enrichment",icon: <FaUserPlus />, options: [{name: "Single Lookup",path: "/profile-lookup"},{name: "Bulk Lookup",path: "/bulk-lookup"}] },
    { name: "Linkedin Contact Verification",icon: <FaUserPlus />, options: [{name: "Upload contact Link",path: "/profile-lookup"},{name: "Contact Statistics",path: "/bulk-lookup"}] },
    { name: "Linkedin Company Details",icon: <FaUserPlus />, options: [{name: "Upload Company link",path: "/profile-lookup"},{name: "Company Statistics",path: "/bulk-lookup"}] },
    {
      name: "Settings",
      icon:<IoMdSettings />,
      options: [
        { name: "Add User", path: "/add-user" },
        { name: "User Lists", path: "/user-list" },
        { name: "Sign out",path: "/" },
      ],
    },     {
      name: "Statistics",
      options: [
        { name: "Lookup Statistics", path: "/UserStatistics" },
        { name: "Credit Reports", path: "/user-credit-report" },
        { name: "User Statistics", path: "/statistic" },
      ],
    },
  ];

  const userMenuItems = [
    { name: "Direct Number Enrichment",icon: <FaUserPlus />, options: [{name: "Single Lookup",path: "/profile-lookup"},{name: "Bulk Lookup",path: "/bulk-lookup"},{name: "Number Statistics",path: "/UserStatistics"}] },
    { name: "Linkedin Contact Verification",icon: <FaUserPlus />, options: [{name: "Upload contact Link",path: "/profile-lookup"},{name: "Contact Statistics",path: "/bulk-lookup"}] },
    { name: "Linkedin Company Details",icon: <FaUserPlus />, options: [{name: "Upload Company link",path: "/profile-lookup"},{name: "Company Statistics",path: "/bulk-lookup"}] },
    
   
    {
      name: "Statistics",
      icon:<FaChartBar/>,
      options: [
        
        { name: "Credit Reports", path: "/user-credit-report" },

        
      ],
    },
    
    {
      name: "Settings",
      icon:<IoMdSettings />,
      options: [
      
        { name: "Sign out",path: "/" },
      ],
    }, 
  ];

  const superAdminItems = [
    { name: "All Admin", path: "/all-admin",icon:<FaChartBar/> },
    { name: "All User", path: "/all-user", icon:<FaChartBar/> },
    { name: "All User Statistic", path: "/all-user-statistics",icon:<FaChartBar/> },
    { name: "Credit Report", path: "/admin-credit-report",icon:<FaChartBar/> },
    { name: "Sign out", path: "/",icon:<FaChartBar/>},
  ];

  const menuItems =
    roleId === "1" ? adminMenuItems :
    roleId === "2" ? userMenuItems :
    roleId === "3" ? superAdminItems : [];

  const handleMenuClick = (menuItem) => {
    if (menuItem === "Sign out") {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("roleId");
      navigate("/")
      
    }
  };

  return (
    <aside className="menu-container">
      <div className="user-info">
      <FaUsers className="avatar" />
        <p className="e">{userEmail ? userEmail : "Loading..."}</p>
        <img className="b2b"src="new.png" alt="" />
      </div>
      <nav className="menu">
        
          {menuItems.map((item, index) => (
            <li key={item.name} className="menu-item">
               
              <button
                onClick={() => {
                  setExpandedItem(expandedItem === index ? null : index);
                  handleMenuClick(item.name);
                }}
                className={
                  item.path === location.pathname ? "menu-button" : "menu-button"
                }
              >
             
                 {item.icon}
              {item.path ? (
                <Link to={item.path} className="menu-link">{item.name}</Link>
               
              ) : (
                item.name
              )}
                 {item.options && (
                expandedItem === index ? (
                  <FaChevronUp className="expand-icon" />
                ) : (
                  <FaChevronDown className="expand-icon" />
                )
              )}
                
              </button>
              {expandedItem === index && item.options && (
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
        {roleId === "1" && (
          <div className="start">
        <div className="start-plan">
          <h3>Start Your Plan</h3>
          <p className="up">Upgrade your plan to unlock additional features and access more credits.</p>
          <button className="upgrade">Upgrade</button>
        </div>
        </div>
      )}
      </nav>
      
    </aside>
  );
};

export default Sidebar;