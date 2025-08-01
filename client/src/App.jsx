import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Index from "./components";
import Header from "./components/header";
import Footer from "./components/footer";

import LinkedinContactVerification from "./components/LinkedinContactVerification";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ProfileLookup from "./components/ProfileLookup";
import BulkLookup from "./components/BulkLookup";
import AddUser from "./components/AddUser";
import Statistic from "./components/Statistic";
import UserList from "./components/UserList";
import UserStatistics from "./components/UserStatistics";
import AllUser from "./components/AllUser";
import AllAdmin from "./components/AllAdmin";
// import AllStatistics from "./components/AllStatistics";
import AdminCreditReport from "./components/AdminCreditReport";
import Services from "./components/Services";
import UserCreditReport from "./components/UserCreditReport";
import Api from "./components/Api";
import ContactUs from "./components/ContactUs";
// import Bulk from "./components/Bulk";
import TempLinkMobileForm from "./components/TempLinkMobileForm";
// import Bulk from "./components/Bulk";
import Linkedin_Contect from "./components/Linkedin_Contect";
import Linkedin_Company from "./components/Linkedin_Company";
import Alladmincompanycredits from "./components/Alladmincompanycredits";
import "./App.css";
import AboutUs from "./components/AboutUs";
import CreditsManagementPage from "./components/CreditsManagementPage";
import Checkout from "./components/Checkout";
import PaymentStatus from "./components/PaymentStatus";
import PayPalReturnHandler from "./components/PayPalReturnHandler";
import VerificationLinks from "./components/Verification_links";
import Verification_company from "./components/Verification_company";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import CheckoutPage from "./components/CheckoutPage";
import ScrollToTop from "./components/ScrollToTop";
import RequestResetForm from "./components/RequestResetForm";
import Remove_form from "./components/Remove_form";
import AllHistory from "./components/AllReport";
import Alladmin_S from "./components/Alladmin_S";
import All_pending_history from "./components/All_pending_history"



function App() {
  const location = useLocation();
  const excludePaths = [
    
    // "/profile-lookup",
    "/bulk-lookup",
    "/statistic",
    "/add-user",
    // "/checkout",
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
    
  ]; // Paths without Header/Footer

  const isExcluded = excludePaths.includes(location.pathname); // Check if current path matches

  return (
    <>
      {!isExcluded && <Header />} {/* Show Header if path is not excluded */}
      <Routes>
        <Route path="/" element={<Index />} />
        
        <Route path="/services" element={<Services />} />
        {/* <Route path="/profile-lookup" element={<ProfileLookup />} /> */}
        <Route path="/bulk-lookup" element={<BulkLookup />} />
        {/* <Route path="/bulk" element={<Bulk />} /> */}
        <Route path="/statistic" element={<Statistic />} />
        <Route path="/Temp" element={<TempLinkMobileForm />} />
{/* <Route path="/checkout" element={<CheckoutPage/>} /> */}
          
           <Route path="/change_your_password" element={<RequestResetForm />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/api/payments/capture" element={<PayPalReturnHandler />} />
          <Route path="/verfication_links" element={<VerificationLinks />} />
          <Route path="/verfication_com" element={<Verification_company />} />
          <Route path="/privacy_policy" element={<PrivacyPolicy/>} />
           <Route path="/terms-and-conditions" element={<TermsAndConditions/>} />
       <Route path="/Alladmincompanycredits" element={<Alladmincompanycredits />} />
        <Route path="/Linkedin_Contect" element={<Linkedin_Contect />} />
        <Route path="/Linkedin_Company" element={<Linkedin_Company />} />
         <Route path="/all_history" element={<AllHistory />} />
         <Route path="/all_completed_report" element={<All_pending_history />} />

         <Route path="/" element={<Login />} />
        <Route path="/" element={<SignUp />} />
        <Route path="/api" element={<Api />} />
        <Route path="/remove_data" element={<Remove_form/>} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />}/>
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/alladmin" element={<AllAdmin />} />
        <Route path="/all-admin" element={<Alladmin_S />} />
        <Route path="/user-list" element={<UserList />} />
        <Route path="/admin-credit-report" element={<AdminCreditReport />} />
        <Route path="/user-credit-report" element={<UserCreditReport />} />
        <Route path="/all-user" element={<AllUser />} />
        {/* <Route path="/all-user-statistics" element={<AllStatistics />} /> */}
        <Route path="/UserStatistics" element={<UserStatistics />} />
       
        <Route path="/linkedin-contact-verification" element={<LinkedinContactVerification />} />
      </Routes>
      {!isExcluded && <Footer />} {/* Show Footer if path is not excluded */}
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
