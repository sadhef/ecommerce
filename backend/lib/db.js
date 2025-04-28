import mongoose from "mongoose";

// Track connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

// Connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  family: 4, // Use IPv4, skip trying IPv6
  connectTimeoutMS: 30000
};

/**
 * Initializes the MongoDB connection with retry logic
 */
export const connectDB = async () => {
  // If already connected, return the connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  // Reset connection attempts if this is a fresh connection attempt
  if (mongoose.connection.readyState === 0) {
    connectionAttempts = 0;
  }

  try {
    // Check if MONGO_URI is properly set
    if (!process.env.MONGO_URI) {
      console.error('MongoDB URI is not defined in environment variables');
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Add a database name if not present in the URI
    let uri = process.env.MONGO_URI;
    if (!uri.includes('?') && !uri.split('/').pop()) {
      uri = `${uri}/ecommerce`;
      console.log('Added default database name to URI');
    }

    console.log(`Connecting to MongoDB (attempt ${connectionAttempts + 1})...`);
    
    // Debug the URI but hide password
    const redactedUri = uri.replace(
      /:([^@]+)@/,
      ':****@'
    );
    console.log(`Using MongoDB URI: ${redactedUri}`);

    // Connect with options
    const conn = await mongoose.connect(uri, connectionOptions);
    
    isConnected = true;
    connectionAttempts = 0; // Reset on successful connection
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    
    // Set up event listeners for the connection
    setupConnectionEventListeners();
    
    return conn.connection;
  } catch (error) {
    isConnected = false;
    connectionAttempts++;
    console.error(`MongoDB connection error (attempt ${connectionAttempts}): ${error.message}`);
    
    // Provide more detailed error information
    if (error.name === 'MongoServerSelectionError') {
      console.error('MongoDB server selection error - check your connection string and network');
    } else if (error.name === 'MongoParseError') {
      console.error('MongoDB connection string parse error - check your URI format');
    } else if (error.message.includes('Authentication failed')) {
      console.error('MongoDB authentication failed - check your username and password');
    }
    
    // Retry connection with exponential backoff if under max attempts
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_INTERVAL * Math.pow(2, connectionAttempts - 1);
      console.log(`Retrying connection in ${delay/1000} seconds...`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const result = await connectDB();
            resolve(result);
          } catch (retryError) {
            resolve(null); // Continue execution even if all retries fail
          }
        }, delay);
      });
    }
    
    // Return null after all retries fail to allow the app to start without DB
    console.error(`Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts`);
    return null;
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
    
    // Attempt to reconnect when in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Attempting to reconnect to MongoDB...');
      setTimeout(() => {
        connectDB().catch(err => console.error('Reconnection failed:', err));
      }, 5000);
    }
  });
  
  // If the connection throws an error
  connection.on('error', (err) => {
    isConnected = false;
    console.error(`MongoDB connection error: ${err.message}`);
  });
}

/**
 * Ensures that DB is connected before performing operations
 * Returns true if connected, false if unable to connect
 */
export const ensureDbConnected = async () => {
  // If connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }
  
  // If disconnected but not connecting, try to connect
  if (mongoose.connection.readyState !== 2) {
    console.log('Connection not established. Connecting to MongoDB...');
    const connection = await connectDB();
    return connection !== null;
  }
  
  // If already connecting, wait for the connection to complete with timeout
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('Connection attempt timed out');
      resolve(false);
    }, 10000);
    
    mongoose.connection.once('connected', () => {
      clearTimeout(timeout);
      resolve(true);
    });
    
    mongoose.connection.once('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
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
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.db?.databaseName || 'none'
  };
};