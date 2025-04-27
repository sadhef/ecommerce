import axios from "axios";

const axiosInstance = axios.create({
  baseURL: (() => {
    if (import.meta.env.MODE === "development") {
      return "http://localhost:5000/api";
    } else if (window.location.origin.includes("vercel.app")) {
      return "https://ecommerce-u1pz.vercel.app/api";
    } else {
      return "/api";
    }
  })(),
  withCredentials: true, // send cookies to the server
});

export default axiosInstance;