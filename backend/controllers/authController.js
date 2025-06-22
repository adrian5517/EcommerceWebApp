import User from "../models/userModel.js"
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { redis } from "../lib/redis.js";

dotenv.config();

const generateTokens = (userId) => {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('JWT secrets not configured');
    }

    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });

    return {accessToken, refreshToken}

};    const storeRefreshToken = async(userId, refreshToken) =>{
        await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7*24*60*60); // 7 days
    }

    const setCookies = (res , accessToken , refreshToken) =>{        res.cookie("accessToken" , accessToken , {
            httpOnly:true, //prevent XSS attacks , cross-site scripting attack
            secure:process.env.NODE_ENV === "production",
            sameSite:"strict", //prevent CSRF attacks , cross-site request forgery attack
            maxAge:15 * 60 * 1000, //15mins
        })
        res.cookie("refreshToken" , refreshToken, {
            httpOnly:true, //prevent XSS attacks , cross-site scripting attack
            secure:process.env.NODE_ENV === "production",
            sameSite:"strict", //prebent CSRF attacks , cross-site request forgery attack
            maxAge: 7 * 24 * 60 * 60 * 1000, //7days
        })
    }

export const signup = async (req, res) =>{
    const {email, password , name} = req.body;

    try {
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: "User Already exists"})
        }
        const user = await User.create({name ,email , password})

        //authenticate
        const {accessToken , refreshToken} = generateTokens(user._id)
        await storeRefreshToken(user._id,refreshToken);

        setCookies(res, accessToken , refreshToken)
        
        res.status(201).json({user:{
            _id: user.id,
            name:user.name,
            email:user.email,
            role:user.role

        }, message:"User Created Successfully"})
    } catch (error) {
        res.status(500).json({message:error.message})
    }
    
};

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: "Email and Password Required" });
        }        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            return res.json({user:{
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }, message: "Logged in successfully"});
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) =>{
    try {
        if (!req.cookies) {
            return res.status(400).json({ message: "No cookies present" });
        }

        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const redisKey = `refresh_token:${decoded.userId}`;
                const deleted = await redis.del(redisKey);
                if (!deleted) {
                    console.warn(`No refresh token found in Redis for key: ${redisKey}`);
                }
            } catch (tokenError) {
                // If token verification fails, we still want to clear cookies
                console.error('Token verification failed:', tokenError.message);
            }
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({message: "Logged out successfully"});
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({message: "Server error", error: error.message});
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message: "No refresh token provided"});
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({message: "Refresh token has expired"});
            }
            return res.status(403).json({message: "Invalid refresh token"});
        }

        // Verify token exists in Redis
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        if(!storedToken) {
            return res.status(403).json({message: "Refresh token not found"});
        }

        // Verify token matches what's stored
        if(storedToken !== refreshToken) {
            return res.status(403).json({message: "Refresh token has been revoked"});
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {userId: decoded.userId}, 
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "15m"}
        );

        // Set new access token cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Send success response
        return res.json({
            message: "Access token refreshed successfully"
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({message: "Server error", error: error.message});
    }
}
