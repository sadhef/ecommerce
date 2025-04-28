import mongoose from "mongoose";

// Track connection state
let isConnected = false;

// Connection options
const connectionOptions = {
  autoIndex: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  family: 4,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  connectTimeoutMS: 30000
};

/**
 * Initializes the MongoDB connection
 */
export const connectDB = async () => {
  // If already connected, return the connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  try {
    // Check if MONGO_URI is properly set
    if (!process.env.MONGO_URI) {
      console.error('MongoDB URI is not defined in environment variables');
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');

    // Connect with options
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    
    isConnected = true;
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    
    // Set up event listeners for the connection
    setupConnectionEventListeners();
    
    return conn.connection;
  } catch (error) {
    isConnected = false;
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Sets up event listeners for the MongoDB connection
 */
function setupConnectionEventListeners() {
  const connection = mongoose.connection;
  
  // When successfully connected
  connection.on('connected', () => {
    isConnected = true;
    console.log('MongoDB connected');
  });
  
  // When disconnected
  connection.on('disconnected', () => {
    isConnected = false;
    console.log('MongoDB disconnected');
  });
  
  // If the connection throws an error
  connection.on('error', (err) => {
    isConnected = false;
    console.error(`MongoDB connection error: ${err.message}`);
  });
  
  // When the Node process ends, close the connection
  process.on('SIGINT', async () => {
    try {
      await connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
}

/**
 * Ensures that DB is connected before performing operations
 */
export const ensureDbConnected = async () => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    console.log('Connection not established. Connecting to MongoDB...');
    await connectDB();
  }
  return true;
};

/**
 * Gets the current connection status
 */
export const getConnectionStatus = () => {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: readyStateMap[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || 'none'
  };
};