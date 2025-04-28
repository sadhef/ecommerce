import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

// Simple in-memory cache for featured products
let featuredProductsCache = {
  data: null,
  timestamp: null,
  expiryTime: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (featuredProductsCache.data && featuredProductsCache.timestamp &&
      (now - featuredProductsCache.timestamp < featuredProductsCache.expiryTime)) {
      return res.json(featuredProductsCache.data);
    }

    // If no cache or expired, fetch from database with shorter timeout
    const featuredProducts = await Promise.race([
      Product.find({ isFeatured: true }).lean().exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Featured products query timeout')), 5000)
      )
    ]);

    // If no featured products found, return all products (limited to 8)
    if (!featuredProducts || featuredProducts.length === 0) {
      const allProducts = await Promise.race([
        Product.find({}).limit(8).lean().exec(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('All products query timeout')), 5000)
        )
      ]);
      
      // Update cache with all products
      featuredProductsCache = {
        data: allProducts,
        timestamp: now,
        expiryTime: 24 * 60 * 60 * 1000
      };
      
      return res.json(allProducts);
    }

    // Update our cache with featured products
    featuredProductsCache = {
      data: featuredProducts,
      timestamp: now,
      expiryTime: 24 * 60 * 60 * 1000
    };

    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    
    // Try to return cached data even if expired as a fallback
    if (featuredProductsCache.data) {
      console.log("Returning expired cache data as fallback");
      return res.json(featuredProductsCache.data);
    }
    
    // Return empty array as last resort
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    let imageUrl = ""; // Default empty string instead of placeholder

    // Only try to upload to Cloudinary if we have an image string
    if (image && image.trim() !== '') {
      try {
        // Check if it's a valid base64 image
        if (image.startsWith('data:image')) {
          const cloudinaryResponse = await cloudinary.uploader.upload(image, { 
            folder: "products",
            timeout: 60000 // 60 second timeout
          });
          
          if (cloudinaryResponse && cloudinaryResponse.secure_url) {
            imageUrl = cloudinaryResponse.secure_url;
            console.log("Image uploaded successfully:", imageUrl);
          }
        }
      } catch (uploadError) {
        console.log("Error uploading to Cloudinary:", uploadError);
        // Continue with empty image URL if Cloudinary fails
      }
    }

    // Create the product with the image URL (could be empty string)
    const product = await Product.create({
      name,
      description,
      price,
      image: imageUrl,
      category,
    });

    // Reset cache when a new product is created
    featuredProductsCache.data = null;
    featuredProductsCache.timestamp = null;

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      try {
        // Extract the public ID from the Cloudinary URL
        const publicId = product.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.log("error deleting image from cloudinary", error);
        // Continue even if Cloudinary delete fails
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Reset featured products cache
    featuredProductsCache.data = null;
    featuredProductsCache.timestamp = null;

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    // Try to get some random products with a timeout
    const products = await Promise.race([
      Product.aggregate([
        { $sample: { size: 4 } },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            image: 1,
            price: 1,
          },
        },
      ]).exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Recommended products query timeout')), 5000)
      )
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    // Return empty array instead of error to prevent frontend issues
    res.json([]);
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }
    
    // Find products with a timeout
    const products = await Promise.race([
      Product.find({ category }).lean().exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Category products query timeout')), 5000)
      )
    ]);
    
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    // Return empty products array to prevent frontend issues
    res.json({ products: [] });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    
    // Reset featured products cache
    featuredProductsCache.data = null;
    featuredProductsCache.timestamp = null;
    
    res.json(updatedProduct);
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};