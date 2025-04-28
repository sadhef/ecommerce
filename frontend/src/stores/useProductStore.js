import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
	products: [],
	loading: false,
	error: null,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
		} catch (error) {
			console.error("Error creating product:", error);
			toast.error(error.response?.data?.message || "Failed to create product");
			set({ loading: false });
		}
	},
	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			// Ensure response data is valid
			if (response && response.data && response.data.products) {
				set({ products: response.data.products, loading: false, error: null });
			} else {
				console.error("Invalid response format from /products endpoint");
				set({ products: [], loading: false, error: "Failed to fetch products: Invalid response format" });
			}
		} catch (error) {
			console.error("Error fetching products:", error);
			set({ 
				products: [], 
				loading: false, 
				error: error.response?.data?.message || "Failed to fetch products" 
			});
			toast.error(error.response?.data?.message || "Failed to fetch products");
		}
	},
	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axios.get(`/products/category/${category}`);
			// Ensure response data is valid
			if (response && response.data && response.data.products) {
				set({ products: response.data.products, loading: false, error: null });
			} else {
				console.error("Invalid response format from category products endpoint");
				set({ products: [], loading: false, error: "Failed to fetch products: Invalid response format" });
			}
		} catch (error) {
			console.error("Error fetching products by category:", error);
			set({ 
				products: [], 
				loading: false, 
				error: error.response?.data?.message || "Failed to fetch products" 
			});
			toast.error(error.response?.data?.message || "Failed to fetch products");
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevState) => ({
				products: prevState.products.filter((product) => product._id !== productId),
				loading: false,
			}));
		} catch (error) {
			console.error("Error deleting product:", error);
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to delete product");
		}
	},
	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			// this will update the isFeatured prop of the product
			set((prevState) => ({
				products: prevState.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			console.error("Error toggling featured product:", error);
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update product");
		}
	},
	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			// Ensure response data is valid
			if (response && response.data) {
				set({ products: response.data, loading: false, error: null });
			} else {
				console.error("Invalid response format from featured products endpoint");
				set({ products: [], loading: false, error: "Failed to fetch featured products: Invalid response format" });
			}
		} catch (error) {
			console.error("Error fetching featured products:", error);
			set({ 
				products: [], 
				loading: false, 
				error: error.response?.data?.message || "Failed to fetch featured products" 
			});
		}
	},
}));