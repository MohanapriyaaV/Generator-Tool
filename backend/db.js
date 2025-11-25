// db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI for flexibility
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ MongoDB Connection Error: MONGO_URI or MONGODB_URI not found in environment variables");
      console.error("Please add MONGO_URI or MONGODB_URI to your .env file");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};