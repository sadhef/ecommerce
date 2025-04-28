import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "https://ecommerce-h3q3.vercel.app/" : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
