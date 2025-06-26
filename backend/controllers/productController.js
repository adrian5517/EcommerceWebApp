import { redis } from "../lib/redis.js";
import Product from "../models/productModel.js";
import cloudinary from "../lib/cloudinary.js";

// Get all products with pagination and filtering
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const skip = (page - 1) * limit;

        // Check Redis cache first
        let products = await redis.get(`products_page_${page}_limit_${limit}_category_${category}`);
        if (products) {
            return res.json(JSON.parse(products));
        }

        // Build query based on category filter
        const query = category ? { category } : {};

        // Fetch products from database
        products = await Product.find(query).skip(skip).limit(Number(limit)).lean();
        
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        // Store in Redis cache for quick access
        await redis.set(`products_page_${page}_limit_${limit}_category_${category}`, JSON.stringify(products));

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedProducts = async (req , res)=>{
    try {
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts){
            return res.json(JSON.parse(featuredProducts));
        }

        // if not in redis fetch from database
        featuredProducts = await Product.find({ isFeatured: true}).lean();
        if(!featuredProducts){
            return res.JSON({ message: "No featured products found" });
        }
        //store in redis for quick access
        await redis.set("featured_products", JSON.stringify(featuredProducts))
        res.json(featuredProducts);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Server error", error: error.message });
        
    }
}

export const createProduct = async (req , res) =>{
    try {
        const { name, description, price , category, image, isFeatured } = req.body;
        
        let cloudinaryResponse = null;

        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image,{folder: "products"});
        }

        const product = new Product.create({
            name,
            description,
            price,
            category,
            image: cloudinaryResponse.secure_url ? cloudinaryResponse.secure_url : "",
        })
        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const deleteProduct = async (req,res) =>{
    try {
        const product = await Product.findById(req.params.id);
        if (!product){
            return res.status(404).json({ message: "Product not found" });
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from Cloudinary");
                
            } catch (error) {
                console.error("Error deleting image from Cloudinary:", error);
                return res.status(500).json({ message: "Error deleting image from Cloudinary", error: error.message });
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
