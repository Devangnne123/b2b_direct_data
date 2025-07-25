import { useState, useEffect } from "react";
import "../css/Api.css";

export default function Api() {
  const calculateTimeLeft = () => {
    const launchDate = new Date("2025-12-12").getTime();
    const now = new Date().getTime();
    const difference = launchDate - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container_api">
      <div className="card">
        <h1 className="title">API Coming Soon 🚀</h1>
        <p className="description">
          Contact Our Sales Representative For Details.
        </p>
        {/* <div className="countdown">
          <span>{timeLeft.days}d</span>
          <span>{timeLeft.hours}h</span>
          <span>{timeLeft.minutes}m</span>
          <span>{timeLeft.seconds}s</span>
        </div> */}
        <a href="/contactus" className="notify-button">Contact US</a>
      </div>
    </div>
  );
}
