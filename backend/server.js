import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

//Routes
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts",cartRoutes)
app.use("/api/coupons", couponRoutes);


app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
    connectDB();
})


