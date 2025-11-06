import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import quotationRoutes from "./routes/quotation_routes.js";
import uploadS3 from "./routes/uploadS3.js";

dotenv.config();
// ✅ Establish DB connection
connectDB(); 

const app = express();

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/quotations", quotationRoutes);
app.use("/api/upload", uploadS3);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));