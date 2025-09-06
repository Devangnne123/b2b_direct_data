
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  
  Navigate,
} from "react-router-dom";
import Index from "./components/index";
import Header from "./components/header";
import Footer from "./components/footer";

import LinkedinContactVerification from "./components/LinkedinContactVerification";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import BulkLookup from "./components/BulkLookup";
import AddUser from "./components/AddUser";
import Statistic from "./components/Statistic";
import UserList from "./components/UserList";
import UserStatistics from "./components/UserStatistics";
import AllUser from "./components/AllUser";
import AllAdmin from "./components/AllAdmin";
import AdminCreditReport from "./components/AdminCreditReport";
import Services from "./components/Services";
import UserCreditReport from "./components/UserCreditReport";
import Api from "./components/Api";
import ContactUs from "./components/ContactUs";
import TempLinkMobileForm from "./components/TempLinkMobileForm";
import Linkedin_Contect from "./components/Linkedin_Contect";
import Linkedin_Company from "./components/Linkedin_Company";
import Alladmincompanycredits from "./components/Alladmincompanycredits";
import AboutUs from "./components/AboutUs";
import CreditsManagementPage from "./components/CreditsManagementPage";
import PaymentStatus from "./components/PaymentStatus";
import PayPalReturnHandler from "./components/PayPalReturnHandler";
import VerificationLinks from "./components/Verification_links";
import Verification_company from "./components/Verification_company";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import RequestResetForm from "./components/RequestResetForm";
import ScrollToTop from "./components/ScrollToTop";
import Remove_form from "./components/Remove_form";
import AllHistory from "./components/AllReport";
import Alladmin_S from "./components/Alladmin_S";
import All_pending_history from "./components/All_pending_history";
import "./App.css";

// Cookie management functions
const getCookie = (name) => {
  const matches = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)")
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

// Cookie Popup Component
const CookiePopup = ({ onAccept, onReject, onCustomize, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className={`cookie-popup ${isVisible ? '' : 'hidden'}`}>
      <h2>Cookie Consent</h2>
      <p>
        We use cookies to enhance your experience on our website. Some cookies are essential for functionality, while others help us analyze site performance and provide personalized content. For more details, see our{' '}
        <a href="/cookies-policy">Cookies Policy</a>.
      </p>
      <div className="button-group">
        <button className="accept" onClick={onAccept}>
          Accept All
        </button>
        <button className="customize" onClick={onCustomize}>
          Customize
        </button>
        <button className="reject" onClick={onReject}>
          Reject Non-Essential
        </button>
      </div>
    </div>
  );
};

// Cookies Policy Component
const CookiesPolicy = () => (
  <div className="cookies-policy">
    <h1>Cookies Policy</h1>
    <p>
      <strong>B2B Lead Solutions</strong> ("we", "us", or "our") uses cookies on our website to enhance user experience, analyze site performance, and provide personalized content. This Cookies Policy explains what cookies are, how we use them, and your rights regarding their use, in compliance with the General Data Protection Regulation (GDPR).
    </p>

    <h2>1. What Are Cookies?</h2>
    <p>
      Cookies are small text files stored on your device when you visit our website. They help us improve your browsing experience and provide certain functionalities.
    </p>

    <h2>2. Types of Cookies We Use</h2>
    <ul>
      <li><strong>Essential Cookies</strong>: Necessary for the website to function properly (e.g., navigation, access to secure areas). These cannot be disabled.</li>
      <li><strong>Analytical Cookies</strong>: Help us understand how visitors interact with our website by collecting anonymous data (e.g., Google Analytics).</li>
      <li><strong>Marketing Cookies</strong>: Used to deliver personalized advertisements based on your interests.</li>
      <li><strong>Functional Cookies</strong>: Enable enhanced functionality, such as remembering your preferences.</li>
    </ul>

    <h2>3. How We Use Cookies</h2>
    <p>We use cookies to:</p>
    <ul>
      <li>Ensure the website operates effectively.</li>
      <li>Analyze website traffic and performance.</li>
      <li>Personalize content and ads.</li>
      <li>Improve our services and user experience.</li>
    </ul>

    <h2>4. Your Choices</h2>
    <p>
      You can manage your cookie preferences through the consent popup displayed when you visit our website. You may accept all cookies, reject non-essential cookies, or customize your preferences. You can also manage cookies via your browser settings.
    </p>

    <h2>5. Third-Party Cookies</h2>
    <p>
      Some cookies may be set by third-party services (e.g., Google Analytics, advertising platforms). These parties have their own privacy policies, and we encourage you to review them.
    </p>

    <h2>6. Your Rights</h2>
    <p>Under GDPR, you have the right to:</p>
    <ul>
      <li>Access, correct, or delete your personal data.</li>
      <li>Withdraw consent for non-essential cookies at any time.</li>
      <li>Lodge a complaint with a supervisory authority.</li>
    </ul>

    <h2>7. Contact Us</h2>
    <p>
      For questions about our Cookies Policy, please contact us at:
      <br />
      Email: <a href="mailto:info@b2bdirectdata.com">info@b2bdirectdata.com</a>
    </p>

    <h2>8. Updates to This Policy</h2>
    <p>
      We may update this Cookies Policy periodically. Changes will be posted on this page with an updated effective date.
      <br />
      <em>Effective Date: September 4, 2025</em>
    </p>
  </div>
);

// Customize Modal Component
const CustomizeModal = ({ isOpen, onClose }) => {
  const [analytical, setAnalytical] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleSave = () => {
    setCookie("cookieConsent", JSON.stringify({ analytical, marketing }), 365);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className={`customize-modal ${isOpen ? '' : 'hidden'}`}>
      <div className="modal-content">
        <h2>Cookie Preferences</h2>
        <label>
          <input
            type="checkbox"
            checked={analytical}
            onChange={(e) => setAnalytical(e.target.checked)}
          /> Analytical Cookies
        </label>
        <label>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          /> Marketing Cookies
        </label>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

// ProtectedRoute Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(parseInt(user.roleId))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// PublicRoute Component
const PublicRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Cookie consent logic
  useEffect(() => {
    if (!getCookie("cookieConsent")) {
      setShowPopup(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie("cookieConsent", "accepted", 365);
    setShowPopup(false);
    // Uncomment and customize for analytics/marketing scripts
    // const script = document.createElement('script');
    // script.src = 'https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID';
    // script.async = true;
    // document.head.appendChild(script);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', 'YOUR_GA_ID');
  };

  const handleReject = () => {
    setCookie("cookieConsent", "rejected", 365);
    setShowPopup(false);
    // Add logic to disable non-essential cookies
  };

  const handleCustomize = () => {
    setShowPopup(false);
    setShowCustomizeModal(true);
  };

  // Existing session synchronization and active status checks
  useEffect(() => {
    const checkActiveStatus = async () => {
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (user && token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/check-status`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: user.email })
          });

          const data = await response.json();

          if (!data.isActiveLogin) {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ email: user.email })
            });

            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('logout-event', Date.now().toString());
            navigate("/");
          }
        } catch (error) {
          console.error("Active status check error:", error);
        }
      }
    };

    // Check every 5 minutes
    // const statusCheckInterval = setInterval(checkActiveStatus, 10000);

    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }

      if (e.key === 'token' && !e.newValue) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      // clearInterval(statusCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Existing session synchronization across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }

      if (e.key === 'token' && !e.newValue) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    const token = localStorage.getItem('token');
    if (!token) {
      sessionStorage.clear();
    } else {
      sessionStorage.setItem('token', token);
      const user = localStorage.getItem('user');
      if (user) sessionStorage.setItem('user', user);
      const roleId = localStorage.getItem('roleId');
      if (roleId) sessionStorage.setItem('roleId', roleId);
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const excludePaths = [
    "/bulk-lookup",
    "/statistic",
    "/add-user",
    "/buy",
    "/verfication_com",
    "/verfication_links",
    "/Alladmincompanycredits",
    "/Linkedin_Contect",
    "/Linkedin_Company",
    "/temp",
    "/user-list",
    "/UserStatistics",
    "/all-user",
    "/all-admin",
    "/all-user-statistics",
    "/admin-credit-report",
    "/user-credit-report",
    "/change_your_password",
    "/all_history",
    "/all_completed_report"
  ];

  const isExcluded = excludePaths.includes(location.pathname);

  return (
    <>
      {!isExcluded && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/services" element={<Services />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/api" element={<Api />} />
        <Route path="/privacy_policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/cookies-policy" element={<CookiesPolicy />} />
        <Route path="/change_your_password" element={<RequestResetForm />} />
        <Route path="/remove_data" element={<Remove_form />} />

        {/* Protected Routes */}
        <Route path="/bulk-lookup" element={<ProtectedRoute><BulkLookup /></ProtectedRoute>} />
        <Route path="/statistic" element={<ProtectedRoute><Statistic /></ProtectedRoute>} />
        <Route path="/temp" element={<ProtectedRoute><TempLinkMobileForm /></ProtectedRoute>} />
        <Route path="/verfication_links" element={<ProtectedRoute><VerificationLinks /></ProtectedRoute>} />
        <Route path="/verfication_com" element={<ProtectedRoute><Verification_company /></ProtectedRoute>} />
        <Route path="/Alladmincompanycredits" element={<ProtectedRoute><Alladmincompanycredits /></ProtectedRoute>} />
        <Route path="/Linkedin_Contect" element={<ProtectedRoute><Linkedin_Contect /></ProtectedRoute>} />
        <Route path="/Linkedin_Company" element={<ProtectedRoute><Linkedin_Company /></ProtectedRoute>} />
        <Route path="/all_history" element={<ProtectedRoute><AllHistory /></ProtectedRoute>} />
        <Route path="/all_completed_report" element={<ProtectedRoute><All_pending_history /></ProtectedRoute>} />
        <Route path="/add-user" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
        <Route path="/alladmin" element={<AllAdmin />} />
        <Route path="/all-admin" element={<ProtectedRoute><Alladmin_S /></ProtectedRoute>} />
        <Route path="/user-list" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/admin-credit-report" element={<ProtectedRoute><AdminCreditReport /></ProtectedRoute>} />
        <Route path="/user-credit-report" element={<ProtectedRoute><UserCreditReport /></ProtectedRoute>} />
        <Route path="/all-user" element={<ProtectedRoute><AllUser /></ProtectedRoute>} />
        <Route path="/UserStatistics" element={<ProtectedRoute><UserStatistics /></ProtectedRoute>} />
        <Route path="/linkedin-contact-verification" element={<ProtectedRoute><LinkedinContactVerification /></ProtectedRoute>} />
        <Route path="/payment-status" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
        <Route path="/api/payments/capture" element={<ProtectedRoute><PayPalReturnHandler /></ProtectedRoute>} />
      </Routes>
      {!isExcluded && <Footer />}
      <ScrollToTop />
      <CookiePopup
        isVisible={showPopup}
        onAccept={handleAccept}
        onReject={handleReject}
        onCustomize={handleCustomize}
      />
      <CustomizeModal isOpen={showCustomizeModal} onClose={() => setShowCustomizeModal(false)} />
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router basename="/">
      <App />
    </Router>
  );
}