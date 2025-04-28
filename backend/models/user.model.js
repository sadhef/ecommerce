import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters long"],
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
					min: [1, "Quantity cannot be less than 1"]
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
			},
		],
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		refreshToken: {
			type: String,
			default: null
		}
	},
	{
		timestamps: true,
	}
);

// Index for faster lookup by email
userSchema.index({ email: 1 });

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
	// Only hash the password if it's modified
	if (!this.isModified("password")) return next();

	try {
		// Generate a salt with cost factor 10
		const salt = await bcrypt.genSalt(10);
		
		// Hash password with salt
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		// Use bcrypt's compare function with timeout protection
		return await Promise.race([
			bcrypt.compare(candidatePassword, this.password),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Password comparison timeout')), 5000)
			)
		]);
	} catch (error) {
		console.error("Error comparing password:", error);
		return false;
	}
};

// Method to safely convert user to JSON (removes sensitive data)
userSchema.methods.toJSON = function() {
	const userObject = this.toObject();
	delete userObject.password;
	delete userObject.refreshToken;
	return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;