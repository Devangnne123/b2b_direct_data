import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
import { StarFilled } from "@ant-design/icons";
import "../css/Index.css";

function Index() {
  const [showModal, setShowModal] = useState(false); // State to toggle modal visibility
  const [email, setEmail] = useState(""); // State to hold email input value
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate("/signup"); // Navigate to the login page
  };

  const services = [
    {
      icon: "Capture-removebg-preview (2).png",
      title: "Direct Data Enrichment",
      link:"./mobile-enrichment"
    },
    {
      icon: "Capturee-removebg-preview.png",
      title: "LinkedIn Company Details",
      link:"./mobile-enrichment"
    },
    {
      icon: "Captureq-removebg-preview (2).png",
      title: "LinkedIn Contact Verification",
      link:"/linkedin-contact-verification"
    },
  ];

  const features = [
    {
      check: "End-to-End Encryption",
      description: "Protecting all data transmissions with SSL/TLS.",
    },
    {
      check: "GDPR & CCPA Compliance",
      description: "Ensuring ethical and legal data handling.",
    },
    {
      check: "Secure Data Processing",
      description: "Preventing unauthorized access and breaches.",
    },
    {
      check: "Regular Security Audits",
      description: "Continuous monitoring for data integrity.",
    },
    {
      check: "User  Control & Transparency",
      description: "Opt-out options and data deletion policies.",
    },
  ];

  const services_details = [
    {
      title: "LinkedIn Contact Verification (Bulk)",
      description:
        "Ensure the accuracy and reliability of your LinkedIn network with our Bulk Contact Verification service. We help businesses, recruiters, and professionals verify large volumes of LinkedIn profiles to streamline connections, enhance outreach efforts, and maintain an up-to-date network. Our automated process efficiently cross-references contact details, employment history, and profile authenticity, saving you time and ensuring your LinkedIn connections are credible and current. Whether you're looking to clean up your CRM or improve your lead generation, our bulk verification service provides peace of mind with fast, accurate results.",
    },
    {
      title: "Enrich Direct Number",
      description:
        "Unlock deeper connections with our Enrich Direct Number service. We specialize in enhancing your contact database by providing accurate direct phone numbers. Whether you're looking to improve your sales outreach, customer service, or networking efforts, our service ensures you have the right contact information to reach your target audience. Using advanced data enrichment techniques, we help you connect with key decision-makers and valuable leads, providing a direct line to grow your business more efficiently. Maximize your outreach potential with reliable phone numbers—every time.",
    },
    {
      title: "Linkedin Company Details (Bulk)",
      description:
        "Streamline your business research with our Linkedin Company Details service. We gather comprehensive information from LinkedIn company pages to provide you with accurate and up-to-date company profiles in bulk. Whether you need details for lead generation, market analysis, or competitor research, our service offers valuable insights into company size, industry, key employees, and more. With our bulk data extraction, you can save time and effort while accessing detailed company information that helps drive smarter business decisions and targeted outreach. Let us provide you with the company data you need to scale your efforts efficiently.",
    },
  ];

  const handleSearch = () => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setShowModal(true); // Show modal if email is invalid
    } else {
      alert("Email format is correct! Proceed with the search.");
    }
  };

  return (
    <div className="page-container">
      
    <div className="MAIN">
  
    {/* Hero Section */}
    <section className="heroSection">
      <div className="heroContainer">
        <div className="right-r">
       <div className="section-m">
        <h1 className="heroText">
          Verify & Enrich
          <span className="blueText"> Linkedin </span>
          connections effortlessly
        </h1>
        <div className="search-email">
        <p className="sub-text1">
        Gather real-time contact and company data from an email address with
        our Reverse Email Lookup tool made for businesses.
      </p>
      <div className="input-container">
        <input
          type="email"
          placeholder="Try an email address"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Update email state
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>
      </div>
        </div>

        
      
        </div>

      {/* Services Cards */}

      <section className="servicesCards">
        <div className="servicesContainer">.</div>
        <section className="SERVICES">SERVICES</section>
        <section className="main-s">
          {services.map((service, index) => (
            <article key={index} className="serviceCard">
              <img
                src={service.icon}
                alt={service.title}
                className="serviceIcon"
              />
              <h3 className="serviceTitle">{service.title}</h3>
              <a className="useNowBtn1" href={service.link}>Use Now</a>
            </article>
          ))}
          
        </section>
        <div className="servicesDescription">
          {/* <div className="hand"><img src="q-removebg-preview.png" alt="" /></div> */}
        {services_details.map((service, index) => (
          <article key={index} className="serviceDetail">
            {/* <h3 className="serviceHeading">{service.title}</h3> */}
            {/* <p className="serviceText">{service.description}</p> */}
          </article>
        ))}
      </div>

      </section>
      </div>
      {/* <section className="featuresSection">
      <div className="featuresContent">
        <img width="500px"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/24725e4db5be734aef05bd0d13a2917d4bc10fc2"
          alt="Security Features"
          className="featuresImage"
        />
        <div className="security">
        <h2 className="securityTitle">
          🔒 Data
          <span className="blueText"> Security </span>&
          <span className="blueText"> Privacy </span>
          Assurance
        </h2>
        <div className="securityFeatures">
          {features.map((feature, index) => (
            <div key={index} className="featureItem">
              <span>✔ {feature.check} – </span>
              
              <span className="featureDescription">
                {feature.description}
                
              </span>
              <br /><br />
            </div>
          ))}
        </div>
        </div>
      </div>

      
    </section> */}

 
   

    {/* Footer */}
    
  </section>

  </div>

  {showModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <img className="popup-logo" src="/logo.png" />
          <button
            className="close-button-x"
            onClick={() => setShowModal(false)}
          >
            &times;
          </button>
          <div className="modal-body">
            <img
              src="/signup.png" // Replace with your own hosted image link
              alt="Warning"
              className="modal-image"
            />
          </div>
          <div className="modal-header">
            <h2>Your email has the wrong format!</h2>
            <p>
              Please check that the email format is correct and try again.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="action-button"
              onClick={handleSignUpClick}
            >
              Sign Up to Get Access
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default Index;
