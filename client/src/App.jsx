import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
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
import "./App.css";
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



// In your App.js or separate component
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

const PublicRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle session synchronization and active status checks
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
            // If server says session is not active, force logout
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
    // const statusCheckInterval = setInterval(checkActiveStatus,10000);
    
    

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

  // Handle session synchronization across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event') {
        // Broadcast logout to all tabs
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
      
      // If token is removed in another tab, logout here too
      if (e.key === 'token' && !e.newValue) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    

    // Check for existing session on load
    const token = localStorage.getItem('token');
    if (!token) {
      // Clear any remnants
      sessionStorage.clear();
    } else {
      // Sync sessionStorage with localStorage
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
        <Route path="/" element={
          
            <Index />
          
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } />
        <Route path="/services" element={<Services />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/api" element={<Api />} />
        <Route path="/privacy_policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/change_your_password" element={<RequestResetForm />} />

        {/* Protected Routes */}
        <Route path="/bulk-lookup" element={
          <ProtectedRoute>
            <BulkLookup />
          </ProtectedRoute>
        } />
        {/* <Route path="/statistic" element={
          <ProtectedRoute>
            <Statistic />
          </ProtectedRoute>
        } /> */}
        {/* <Route path="/Temp" element={
          <ProtectedRoute>
            <TempLinkMobileForm />
          </ProtectedRoute>
        } /> */}
        <Route path="/verfication_links" element={
          <ProtectedRoute>
            <VerificationLinks />
          </ProtectedRoute>
        } />
        <Route path="/verfication_com" element={
          <ProtectedRoute>
            <Verification_company />
          </ProtectedRoute>
        } />
        <Route path="/Alladmincompanycredits" element={
          <ProtectedRoute >
            <Alladmincompanycredits />
          </ProtectedRoute>
        } />
        {/* <Route path="/Linkedin_Contect" element={
          <ProtectedRoute>
            <Linkedin_Contect />
          </ProtectedRoute>
        } />
        <Route path="/Linkedin_Company" element={
          <ProtectedRoute>
            <Linkedin_Company />
          </ProtectedRoute>
        } /> */}
        <Route path="/all_history" element={
          <ProtectedRoute >
            <AllHistory />
          </ProtectedRoute>
        } />
        <Route path="/all_completed_report" element={
          <ProtectedRoute >
            <All_pending_history />
          </ProtectedRoute>
        } />
        <Route path="/remove_data" element={
          
            <Remove_form />
          
        } />
        <Route path="/add-user" element={
          <ProtectedRoute >
            <AddUser />
          </ProtectedRoute>
        } />
        <Route path="/alladmin" element={
          
            <AllAdmin />
         
        } />
        <Route path="/all-admin" element={
          <ProtectedRoute>
            <Alladmin_S />
          </ProtectedRoute>
        } />
        <Route path="/user-list" element={
          <ProtectedRoute >
            <UserList />
          </ProtectedRoute>
        } />
        <Route path="/admin-credit-report" element={
          <ProtectedRoute >
            <AdminCreditReport />
          </ProtectedRoute>
        } />
        <Route path="/user-credit-report" element={
          <ProtectedRoute>
            <UserCreditReport />
          </ProtectedRoute>
        } />
        <Route path="/all-user" element={
          <ProtectedRoute >
            <AllUser />
          </ProtectedRoute>
        } />
        {/* <Route path="/UserStatistics" element={
          <ProtectedRoute>
            <UserStatistics />
          </ProtectedRoute>
        } /> */}
        {/* <Route path="/linkedin-contact-verification" element={
          <ProtectedRoute>
            <LinkedinContactVerification />
          </ProtectedRoute>
        } /> */}
        {/* <Route path="/payment-status" element={
          <ProtectedRoute>
            <PaymentStatus />
          </ProtectedRoute>
        } /> */}
        {/* <Route path="/api/payments/capture" element={
          <ProtectedRoute>
            <PayPalReturnHandler />
          </ProtectedRoute>
        } /> */}
      </Routes>
      {!isExcluded && <Footer />}
             <ScrollToTop /> {/* Add this line */}
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