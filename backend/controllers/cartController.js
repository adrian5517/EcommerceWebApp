
import Product from "../models/productModel.js";

export default addToCart = async (req, res) => {
    try {
        const {productId} = req.body;
        const user = req.user;

        const existingCart = user.cartItems.find(item => item.id === productId);
        if(existingCart){
            existingCart.quantity += 1;

        }else{
            user.cartItems.push({
                id: productId,
                quantity: 1
            });
        }
        await user.save();
        
        
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const removeAllFromCart = async (req , res) =>{
    try {
        const {productId} = req.body;
        const user = req.user;
        if(!productId){
            user.cartItems = [];
        }else{
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        await user.save();
        res.json(user.cartItems);
        
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const {id:productId} = req.params;
        const {quantity} = req.body;
        const user = req.user;
        const existingCart = user.cartItems.find((item)=> item.id === productId);

        if(existingCart){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter((item) => item.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            }
            existingCart.quantity = quantity;
            await user.save();
            res.json(user.cartItems);
            
            }else{
                res.status(404).json({ message: "Product not found in cart" });
            }
            
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getCartProducts = async (req, res) => {
    try {
        const cartIds = req.user.cartItems.map(item => item.id);

        const products = await Product.find({ _id: { $in: cartIds } });

        const cartItems = req.user.cartItems.map(cartItem => {
            const fullProduct = products.find(prod => prod._id.toString() === cartItem.id);
            if (!fullProduct) return null;

            return {
                ...fullProduct.toJSON(),
                quantity: cartItem.quantity
            };
        }).filter(Boolean); // remove nulls if any product not found

        res.json(cartItems);
    } catch (error) {
        console.error("Error fetching cart products:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}