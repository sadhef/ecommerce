import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		// Validate user exists
		const user = req.user;
		if (!user) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		// Validate user.cartItems exists
		if (!user.cartItems || !Array.isArray(user.cartItems)) {
			return res.json([]);
		}

		// Get product IDs from cart
		const productIds = user.cartItems.map(item => {
			// Handle both object format and direct ID format
			return typeof item === 'object' && item.product ? item.product : item;
		}).filter(Boolean);

		if (productIds.length === 0) {
			return res.json([]);
		}

		// Find products by IDs
		const products = await Product.find({
			_id: { $in: productIds }
		}).select("_id name description price image category").lean();

		// Map products to include quantities from user cart
		const cartItems = products.map(product => {
			// Try to find matching cart item
			const cartItem = user.cartItems.find(item => {
				const itemId = typeof item === 'object' && item.product 
					? item.product.toString() 
					: item.toString();
				return itemId === product._id.toString();
			});
			
			// Get quantity from cart item or default to 1
			const quantity = cartItem && typeof cartItem === 'object' && cartItem.quantity 
				? cartItem.quantity 
				: 1;
			
			return { 
				...product,
				quantity 
			};
		});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		
		// Validate productId
		if (!productId) {
			return res.status(400).json({ message: "Product ID is required" });
		}
		
		const user = req.user;
		
		// Ensure product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// Initialize cartItems if it doesn't exist
		if (!user.cartItems) {
			user.cartItems = [];
		}

		// Find if product already exists in cart
		const existingItemIndex = user.cartItems.findIndex(item => {
			// Handle both object and string ID formats
			const itemId = typeof item === 'object' && item.product 
				? item.product.toString() 
				: item.toString();
			return itemId === productId;
		});

		if (existingItemIndex !== -1) {
			// Product exists in cart, update quantity
			if (typeof user.cartItems[existingItemIndex] === 'object') {
				// If it's already in object format with quantity
				user.cartItems[existingItemIndex].quantity += 1;
			} else {
				// If it's in simple ID format, convert to object format
				user.cartItems[existingItemIndex] = {
					product: productId,
					quantity: 2 // Was 1, now 2
				};
			}
		} else {
			// Product doesn't exist in cart, add it
			user.cartItems.push({
				product: productId,
				quantity: 1
			});
		}

		// Save user with updated cart
		await user.save();
		
		res.json({ 
			message: "Product added to cart",
			cartItems: user.cartItems 
		});
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		
		if (!productId) {
			// Clear entire cart
			user.cartItems = [];
		} else {
			// Remove specific product
			user.cartItems = user.cartItems.filter(item => {
				// Handle both object and string ID formats
				const itemId = typeof item === 'object' && item.product 
					? item.product.toString() 
					: item.toString();
				return itemId !== productId;
			});
		}
		
		await user.save();
		
		res.json({ 
			message: productId ? "Product removed from cart" : "Cart cleared", 
			cartItems: user.cartItems 
		});
	} catch (error) {
		console.log("Error in removeAllFromCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		
		// Validate inputs
		if (!productId) {
			return res.status(400).json({ message: "Product ID is required" });
		}
		
		if (typeof quantity !== 'number' || isNaN(quantity)) {
			return res.status(400).json({ message: "Quantity must be a number" });
		}
		
		const user = req.user;

		// Find item index in cart
		const existingItemIndex = user.cartItems.findIndex(item => {
			// Handle both object and string ID formats
			const itemId = typeof item === 'object' && item.product 
				? item.product.toString() 
				: item.toString();
			return itemId === productId;
		});

		if (existingItemIndex === -1) {
			return res.status(404).json({ message: "Product not found in cart" });
		}

		if (quantity <= 0) {
			// Remove item if quantity is 0 or negative
			user.cartItems = user.cartItems.filter((_, index) => index !== existingItemIndex);
		} else {
			// Update quantity
			if (typeof user.cartItems[existingItemIndex] === 'object') {
				// If it's already in object format
				user.cartItems[existingItemIndex].quantity = quantity;
			} else {
				// If it's in simple ID format, convert to object format
				user.cartItems[existingItemIndex] = {
					product: productId,
					quantity
				};
			}
		}

		await user.save();
		
		res.json({ 
			message: "Cart updated successfully", 
			cartItems: user.cartItems 
		});
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};