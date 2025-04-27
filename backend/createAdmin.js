import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create a new admin user
    const adminUser = new User({
      name: 'Sadhef',
      email: 'muhammedsadhef@gmail.com',
      password: 'Rifa@4848', // This will be hashed by the pre-save hook
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: muhammedsadhef@gmail.com');
    console.log('Password: Rifa@4848');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    // Close the connection
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

createAdminUser();