import mongoose from "mongoose";

// Track connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 seconds

// Connection options
const connectionOptions = {
  autoIndex: true, // Build indexes
  maxPoolSize: 50, // Maintain up to 50 socket connections
  minPoolSize: 10, // Maintain at least 10 socket connections
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds when initially finding servers
  heartbeatFrequencyMS: 10000, // Check connection state every 10 seconds
  connectTimeoutMS: 30000 // Timeout after 30 seconds when connecting
};

/**
 * Initializes the MongoDB connection
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
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

    connectionAttempts++;
    console.log(`Connecting to MongoDB... Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);

    // Connect with options
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    
    isConnected = true;
    connectionAttempts = 0;
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    
    // Set up event listeners for the connection
    setupConnectionEventListeners();
    
    return conn.connection;
  } catch (error) {
    isConnected = false;
    console.error(`MongoDB connection error: ${error.message}`);
    
    // Retry connection if we haven't reached max attempts
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying connection in ${RECONNECT_INTERVAL/1000} seconds...`);
      return new Promise(resolve => {
        setTimeout(async () => {
          resolve(await connectDB());
        }, RECONNECT_INTERVAL);
      });
    } else {
      console.error(`Maximum connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached. Giving up.`);
      connectionAttempts = 0;
      throw error;
    }
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
    // Attempt to reconnect
    setTimeout(() => {
      if (!isConnected) {
        console.log('Attempting to reconnect to MongoDB...');
        connectDB().catch(err => console.error('Reconnection failed:', err));
      }
    }, RECONNECT_INTERVAL);
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
 * @returns {Promise<boolean>} True if connected
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
 * @returns {Object} Connection status information
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