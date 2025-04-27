import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "https://ecommerce-u1pz.vercel.app/api" : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
