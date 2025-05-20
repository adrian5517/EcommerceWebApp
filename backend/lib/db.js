import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI , { dbName: 'Ecommerce' })
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) { 
        console.log("Error connecting to MongoDB" , error.message)
        process.exit(1)
    }
}