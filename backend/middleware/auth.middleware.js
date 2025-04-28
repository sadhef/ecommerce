/**
 * Custom CORS middleware for handling cross-origin requests
 * with proper credential handling for deployed environments
 */

export const corsMiddleware = (req, res, next) => {
	// Get allowed origins from environment variable or use defaults
	const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'https://ri-cart.vercel.app,http://localhost:5173';
	const allowedOrigins = allowedOriginsEnv.split(',');
	
	const origin = req.headers.origin;
	
	// Specific origin for credential requests
	if (origin && allowedOrigins.includes(origin)) {
	  res.setHeader('Access-Control-Allow-Origin', origin);
	  res.setHeader('Access-Control-Allow-Credentials', 'true');
	} else if (process.env.NODE_ENV === 'development') {
	  // In development, log if origin is not allowed
	  if (origin) {
		console.log(`Origin not allowed by CORS: ${origin}`);
	  }
	}
	
	// Set headers for all responses
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 
	  'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Refresh-Token');
	
	// Handle preflight requests
	if (req.method === 'OPTIONS') {
	  return res.status(200).end();
	}
	
	return next();
  };
  
  export default corsMiddleware;