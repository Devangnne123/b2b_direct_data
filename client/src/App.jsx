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
import MobileEnrichment from "./components/MobileEnrichment";
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
import "./App.css";
import AboutUs from "./components/AboutUs";


function App() {
  const location = useLocation();
  const excludePaths = [
    
    // "/profile-lookup",
    "/bulk-lookup",
    "/statistic",
    "/add-user",
    // "/bulk",
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
       
        <Route path="/Linkedin_Contect" element={<Linkedin_Contect />} />
        <Route path="/Linkedin_Company" element={<Linkedin_Company />} />
         <Route path="/" element={<Login />} />
        <Route path="/" element={<SignUp />} />
        <Route path="/api" element={<Api />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />}/>
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/all-admin" element={<AllAdmin />} />
        <Route path="/user-list" element={<UserList />} />
        <Route path="/admin-credit-report" element={<AdminCreditReport />} />
        <Route path="/user-credit-report" element={<UserCreditReport />} />
        <Route path="/all-user" element={<AllUser />} />
        {/* <Route path="/all-user-statistics" element={<AllStatistics />} /> */}
        <Route path="/UserStatistics" element={<UserStatistics />} />
        <Route path="/mobile-enrichment" element={<MobileEnrichment />} />
        <Route path="/linkedin-contact-verification" element={<LinkedinContactVerification />} />
      </Routes>
      {!isExcluded && <Footer />} {/* Show Footer if path is not excluded */}
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
