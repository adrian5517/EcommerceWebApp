import express from "express";
import { 
    getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct
} from "../controllers/productController.js";
import { protectRoute, adminRoute } from "../middleware/authMiddleware.js";

const router = express.Router();


// Protected admin routes
router.post("/", protectRoute, adminRoute, getAllProducts);
router.post("/featured", getFeaturedProducts);
router.post("/category/:category", getProductsByCategory);
router.post("/recommendation", getRecommendedProducts);
router.get("/", protectRoute, adminRoute , createProduct);
router.delete("/:id", protectRoute, adminRoute , deleteProduct);
router.patch("/:id", protectRoute, adminRoute , toggleFeaturedProduct);


export default router;