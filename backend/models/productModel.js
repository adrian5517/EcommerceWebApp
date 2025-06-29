import mongoose from "mongoose";


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        
    
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
        
    },
    image: {
        type: String,
        required: [true, "Product image URL is required"]
    },
    isFeatured: {
        type: Boolean,
        default: false
    },

},{timestamps: true});

const Product = mongoose.model("Product", productSchema);

export default Product;