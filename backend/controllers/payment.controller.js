import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		// Input validation
		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ 
				error: "Invalid or empty products array",
				message: "Your cart appears to be empty" 
			});
		}

		// Get user
		const user = req.user;
		if (!user) {
			return res.status(401).json({ 
				error: "Unauthorized",
				message: "Please login to continue"
			});
		}
		
		let totalAmount = 0;
		let stripeDiscountId = null;

		// Create line items for Stripe checkout
		const lineItems = products.map((product) => {
			// Ensure price exists and is a number
			if (!product.price || typeof product.price !== 'number') {
				throw new Error(`Invalid price for product: ${product._id}`);
			}
			
			// Convert price to cents for Stripe (with fallback)
			const amount = Math.round((product.price || 0) * 100);
			
			// Add to total (quantity is at least 1)
			const quantity = product.quantity || 1;
			totalAmount += amount * quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name || "Product",
						images: [product.image || "https://placehold.co/300x300?text=No+Image"],
					},
					unit_amount: amount,
				},
				quantity: quantity,
			};
		});

		// Apply coupon if provided
		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ 
				code: couponCode, 
				userId: user._id, 
				isActive: true
			});
			
			if (coupon) {
				// Create a Stripe coupon
				stripeDiscountId = await createStripeCoupon(coupon.discountPercentage);
				
				// Calculate discount for our records
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		// Set success and cancel URLs with fallbacks
		const successUrl = process.env.CLIENT_URL 
			? `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`
			: `${req.headers.origin || 'https://ecommerce-h3q3.vercel.app'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
			
		const cancelUrl = process.env.CLIENT_URL 
			? `${process.env.CLIENT_URL}/purchase-cancel`
			: `${req.headers.origin || 'https://ecommerce-h3q3.vercel.app'}/purchase-cancel`;

		// Create checkout session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: successUrl,
			cancel_url: cancelUrl,
			client_reference_id: user._id.toString(),
			customer_email: user.email,
			...(stripeDiscountId ? {
				discounts: [{ coupon: stripeDiscountId }]
			} : {}),
			metadata: {
				userId: user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity || 1,
						price: p.price || 0,
					}))
				),
			},
		});

		// Create gift coupon if purchase amount is over threshold
		if (totalAmount >= 20000) { // $200.00 in cents
			await createNewCoupon(user._id);
		}
		
		// Return session ID and total amount
		res.status(200).json({ 
			id: session.id, 
			totalAmount: (totalAmount / 100).toFixed(2),
			success: true
		});
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ 
			message: "Error processing checkout", 
			error: error.message 
		});
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		
		// Validate session ID
		if (!sessionId) {
			return res.status(400).json({ 
				message: "Session ID is required"
			});
		}
		
		// Retrieve session from Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		
		// Verify session is paid
		if (session.payment_status === "paid") {
			// Handle coupon deactivation if used
			if (session.metadata.couponCode) {
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			}

			// Parse products from metadata
			let products = [];
			try {
				products = JSON.parse(session.metadata.products);
				
				// Validate products data
				if (!Array.isArray(products)) {
					throw new Error("Invalid products data");
				}
			} catch (error) {
				console.error("Error parsing products from metadata:", error);
				products = [];
			}

			// Create a new Order
			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					quantity: product.quantity || 1,
					price: product.price || 0,
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars
				stripeSessionId: sessionId,
			});

			await newOrder.save();

			// Clean up cart (optional)
			try {
				// Find user and clear cart
				const user = await User.findById(session.metadata.userId);
				if (user) {
					user.cartItems = [];
					await user.save();
				}
			} catch (cartError) {
				console.log("Error clearing cart:", cartError);
				// Continue even if cart clearing fails
			}

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		} else {
			res.status(400).json({
				success: false,
				message: "Payment not completed"
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ 
			message: "Error processing successful checkout", 
			error: error.message 
		});
	}
};

// Helper function to create a Stripe coupon
async function createStripeCoupon(discountPercentage) {
	try {
		// Validate discount percentage
		const validDiscount = Math.min(Math.max(1, Math.round(discountPercentage)), 100);
		
		// Create a coupon in Stripe
		const coupon = await stripe.coupons.create({
			percent_off: validDiscount,
			duration: "once",
			name: `${validDiscount}% Discount`
		});
		
		return coupon.id;
	} catch (error) {
		console.error("Error creating Stripe coupon:", error);
		// Return null if coupon creation fails
		return null;
	}
}

// Helper function to create a new coupon for the user after a large purchase
async function createNewCoupon(userId) {
	try {
		// Delete any existing coupons for this user
		await Coupon.findOneAndDelete({ userId });

		// Generate a random coupon code
		const code = "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase();
		
		// Create new coupon
		const newCoupon = new Coupon({
			code: code,
			discountPercentage: 10,
			expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
			userId: userId,
		});

		await newCoupon.save();
		return newCoupon;
	} catch (error) {
		console.error("Error creating new coupon:", error);
		return null;
	}
}