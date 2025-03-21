import { useEffect, useState } from "react";
import "../css/ContactUs.css";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
    //  useEffect(() => {

    //     setFormData("");
       
    //  }, []);
     
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted", formData);
    alert("Your message has been sent!");
  };

  return (
    <div className="container11">

       
      <div className="card1">
        <h2>Contact Us</h2>
      <p className="heading-contactus">Have questions, feedback, or collaboration ideas? We're here to help!</p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit" className="submit-button">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
