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
    const products = await Product.find({}); // find all products
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

    // If no cache or expired, fetch from database
    const featuredProducts = await Product.find({ isFeatured: true }).lean();

    // If no featured products found, return all products (limited to 8)
    if (!featuredProducts || featuredProducts.length === 0) {
      const allProducts = await Product.find({}).limit(8).lean();
      
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let cloudinaryResponse = null;

    if (image) {
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
      } catch (uploadError) {
        console.log("Error uploading to Cloudinary:", uploadError);
        // Continue with empty image URL if Cloudinary fails
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
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
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
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
    const products = await Product.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }
    
    const products = await Product.find({ category });
    
    if (!products || products.length === 0) {
      return res.json({ products: [] });
    }
    
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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