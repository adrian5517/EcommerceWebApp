import express from "express";
import { 
    getAllProducts,
    getFeaturedProducts,
} from "../controllers/productController.js";
import { protectRoute, adminRoute } from "../middleware/authMiddleware.js";

const router = express.Router();


// Protected admin routes
router.post("/", protectRoute, adminRoute, getAllProducts);
router.post("/featured", protectRoute, adminRoute, getFeaturedProducts);


export default router;