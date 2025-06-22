import { redis } from "../lib/redis.js";
import Product from "../models/productModel.js";

// Get all products with pagination and filtering
export const getAllProducts = async (req, res) => {
    try {
        
    } catch (error) {
        
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


