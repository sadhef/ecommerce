import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api",
  withCredentials: true, // send cookies to the server
});

export default axiosInstance;