import User from "../models/userModel.js"

export const signup = async (req, res) =>{
    const {email, password , name} = req.body;

    try {
        const userExists = await User.findOne({email});

        if(userExists){
            return res.status(400).json({message: "User Already exists"})
        }
        const user = await User.create({name ,email , password})
        
        res.status(201).json({user, message:"User Created Successfully"})
        
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