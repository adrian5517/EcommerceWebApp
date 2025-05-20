import User from "../models/userModel.js"
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { redis } from "../lib/redis.js";

dotenv.config();

const generateTokens = (userId) => {
    const accessToken = jwt.sign({userId} , process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "15m",
    })

    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN , {
        expiresIn: "7d",
    })

    return {accessToken , refreshToken}

};

    const storeRefreshToken = async(userId, refreshToken) =>{
        await redis.set(`refresh_token: ${userId}` , refreshToken , "EX" , 7*24*60*60); // 7 days
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

export const signin = async (req, res) =>{
    res.send("Signin route called")
}

export const logout = async (req, res) =>{
    res.send("logout route called")
}