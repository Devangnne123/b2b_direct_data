import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../css/Index.css";

function Services({ setShowModel }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(null);

  const services = [
    {
      icon: "Capture-removebg-preview (2).png",
      title: "Mobile Enrichment",
      titles: "LinkedIn Contact Verification (Bulk)",
      descriptions:
        "Ensure the accuracy and reliability of your LinkedIn network with our Bulk Contact Verification service. We help businesses, recruiters, and professionals verify large volumes of LinkedIn profiles to streamline connections, enhance outreach efforts, and maintain an up-to-date network. Our automated process efficiently cross-references contact details, employment history, and profile authenticity, saving you time and ensuring your LinkedIn connections are credible and current. Whether you're looking to clean up your CRM or improve your lead generation, our bulk verification service provides peace of mind with fast, accurate results.",
    },
    {
      icon: "Capturee-removebg-preview.png",
      title: "LinkedIn Company",
      titles: "Enrich Direct Number",
      descriptions:
"Unlock deeper connections with our Enrich Direct Number service. We specialize in enhancing your contact database by providing accurate direct phone numbers. Whether you're looking to improve your sales outreach, customer service, or networking efforts, our service ensures you have the right contact information to reach your target audience. Using advanced data enrichment techniques, we help you connect with key decision-makers and valuable leads, providing a direct line to grow your business more efficiently. Maximize your outreach potential with reliable phone numbers—every time.",
    },  
    {
      icon: "Captureq-removebg-preview (2).png",
      title: "LinkedIn Contact Verification",
      titles: "Linkedin Company Details (Bulk)",
      descriptions:
      "Streamline your business research with our Linkedin Company Details service. We gather comprehensive information from LinkedIn company pages to provide you with accurate and up-to-date company profiles in bulk. Whether you need details for lead generation, market analysis, or competitor research, our service offers valuable insights into company size, industry, key employees, and more. With our bulk data extraction, you can save time and effort while accessing detailed company information that helps drive smarter business decisions and targeted outreach. Let us provide you with the company data you need to scale your efforts efficiently.",
    },
  ];

  const services_details = [
    {
      title: "LinkedIn Contact Verification (Bulk)",
      description:
        "Ensure the accuracy and reliability of your LinkedIn network with our Bulk Contact Verification service...",
    },
    {
      title: "Enrich Direct Number",
      description:
        
"Unlock deeper connections with our Enrich Direct Number service. We specialize in enhancing your contact database by providing accurate direct phone numbers. Whether you're looking to improve your sales outreach, customer service, or networking efforts, our service ensures you have the right contact information to reach your target audience. Using advanced data enrichment techniques, we help you connect with key decision-makers and valuable leads, providing a direct line to grow your business more efficiently. Maximize your outreach potential with reliable phone numbers—every time.",
    },
    {
      title: "Linkedin Company Details (Bulk)",
      description:
        "Streamline your business research with our Linkedin Company Details service. We gather comprehensive information from LinkedIn company pages to provide you with accurate and up-to-date company profiles in bulk. Whether you need details for lead generation, market analysis, or competitor research, our service offers valuable insights into company size, industry, key employees, and more. With our bulk data extraction, you can save time and effort while accessing detailed company information that helps drive smarter business decisions and targeted outreach. Let us provide you with the company data you need to scale your efforts efficiently.",
    },
  ];

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  return (
    <div className="page-container">
      <div className="MAIN">
        {/* Hero Section */}
        <section className="heroSection">
          <div className="heroContainer1">
            {/* Services Cards */}
            <section className="servicesCards2">
              <div className="servicesContainer"></div>
              <section className="SERVICES">SERVICES</section>
              <section className="main-s1">
                {services.map((service, index) => (
                  <div key={index} className="service">
                    <article className="serviceCard1">
                      <img
                        src={service.icon}
                        alt={service.title}
                        className="serviceIcon"
                      />
                      <h3 className="serviceTitle">{service.title}</h3>
                      <button className="useNowBtn1" onClick={() => setShowModel("login")}>
                        Use Now
                      </button>
                    </article>

                    {/* Service Detail Section */}
                    {service.descriptions && (
                      <article className="serviceDetail1">
                        <h3 className="serviceHeading">{service.titles}</h3>
                        <p className="serviceText">{service.descriptions}</p>
                      </article>
                    )}
                  </div>
                ))}
              </section>

              {/* <div className="servicesDescription">
                {services_details.map((service, index) => (
                  <article key={index} className="serviceDetail">
                    <h3 className="serviceHeading">{service.title}</h3>
                    <p className="serviceText">{service.description}</p>
                  </article>
                ))}
              </div> */}
            </section>
          </div>
        </section>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay">
          <div className="modal">
            {showModal === "login" ? (
              <Login closeModal={() => setShowModal(null)} setShowModal={setShowModal} />
            ) : (
              <SignUp closeModal={() => setShowModal(null)} setShowModal={setShowModal} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;
