import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "https://ricarts.vercel.app/" : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
