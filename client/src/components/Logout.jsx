// // components/Logout.js
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// function Logout() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const logout = async () => {
//       try {
//         const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
//         if (token) {
//           await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
//             method: "POST",
//             headers: {
//               "Authorization": `Bearer ${token}`,
//               "Content-Type": "application/json"
//             }
//           });
//         }
        
//         // Clear all storage
//         localStorage.clear();
//         sessionStorage.clear();
        
//         // Broadcast logout to other tabs
//         localStorage.setItem('logout-event', Date.now());
        
//         // Redirect to login
//         navigate("/login");
//       } catch (error) {
//         console.error("Logout error:", error);
//         // Still clear storage and redirect even if API call fails
//         localStorage.clear();
//         sessionStorage.clear();
//         localStorage.setItem('logout-event', Date.now());
//         navigate("/login");
//       }
//     };

//     logout();
//   }, [navigate]);

//   return (
//     <div className="logout-container">
//       <p>Logging out...</p>
//     </div>
//   );
// }

// export default Logout;