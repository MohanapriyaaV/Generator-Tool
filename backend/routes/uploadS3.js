// routes/uploadS3.js
import express from "express";
import multer from "multer";
import s3 from "../s3config.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Original upload route (for backward compatibility)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Check if S3 is configured
    if (!s3) {
      return res.status(503).json({ 
        error: "S3 is not configured. Please configure AWS credentials in .env file." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('Received file:', req.file.originalname);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const folder = process.env.AWS_UPLOAD_FOLDER || "";
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${folder}${fileName}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

     console.log('Uploading to S3 with params:', {
            Bucket: params.Bucket,
            Key: params.Key,
            ContentType: params.ContentType
        });

    const uploadResult = await s3.upload(params).promise();

    return res.json({
      message: "File uploaded successfully",
      url: uploadResult.Location,
      key: uploadResult.Key,
    });
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// New route for PDF uploads with folder specification
router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    // Check if S3 is configured
    if (!s3) {
      return res.status(503).json({ 
        error: "S3 is not configured. Please configure AWS credentials in .env file." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get folder from query parameter or body (e.g., "Quotation", "Invoice", "ProformaInvoice")
    const folder = req.body.folder || req.query.folder || "";
    
    // Validate folder name
    const validFolders = ["Quotation", "Invoice", "ProformaInvoice", "PurchaseOrder"];
    if (folder && !validFolders.includes(folder)) {
      return res.status(400).json({ 
        error: `Invalid folder. Must be one of: ${validFolders.join(", ")}` 
      });
    }

    // Build the full path: Generator tool/[FolderName]/
    const baseFolder = "Generator tool/";
    const folderPath = folder ? `${baseFolder}${folder}/` : baseFolder;
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const key = `${folderPath}${fileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "application/pdf",
    };

    console.log('Uploading PDF to S3:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      Folder: folder
    });

    const uploadResult = await s3.upload(params).promise();

    return res.json({
      message: "PDF uploaded successfully",
      url: uploadResult.Location,
      key: uploadResult.Key,
      folder: folder,
    });
  } catch (error) {
    console.error("❌ S3 PDF Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

