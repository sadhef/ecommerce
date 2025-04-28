import mongoose from "mongoose";

// Track connection status
let isConnected = false;

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maximum number of sockets
  connectTimeoutMS: 15000 // Connection timeout
};

export const connectDB = async () => {
  // If already connected, return
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    // Check if MONGO_URI is properly set
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Add database name if not included in URI
    const uri = process.env.MONGO_URI.endsWith('/') 
      ? `${process.env.MONGO_URI}ecommerce`
      : `${process.env.MONGO_URI}/ecommerce`;

    // Connect with options
    const conn = await mongoose.connect(uri, connectionOptions);
    
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    isConnected = false;
    
    // Throw the error to be handled by the caller
    throw error;
  }
};

// Function to check if DB is connected and reconnect if not
export const ensureDbConnected = async () => {
  if (!isConnected) {
    console.log('Reconnecting to MongoDB...');
    return connectDB();
  }
  return true;
};