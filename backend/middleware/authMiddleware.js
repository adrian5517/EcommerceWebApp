import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes - Verify user is authenticated
export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        try {
            // Verify token
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Add user to request object
            req.user = user;
            next();
            
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: "Invalid token" });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token expired" });
            }
            throw error;
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Admin route protection
export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as admin" });
    }
};
