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

    // Generate a signed URL (valid for 7 days)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uploadResult.Key,
      Expires: 60 * 60 * 24 * 7 // 7 days in seconds
    });

    return res.json({
      message: "File uploaded successfully",
      url: signedUrl, // Return signed URL instead of object URL
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

    // Generate a signed URL (valid for 7 days)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uploadResult.Key,
      Expires: 60 * 60 * 24 * 7 // 7 days in seconds
    });

    return res.json({
      message: "PDF uploaded successfully",
      url: signedUrl, // Return signed URL instead of object URL
      key: uploadResult.Key,
      folder: folder,
    });
  } catch (error) {
    console.error("❌ S3 PDF Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to extract S3 key from URL
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // If it's already a key (no http/https), return as is
    if (!url.startsWith('http')) {
      return decodeURIComponent(url);
    }
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and extract key
    // Format: /bucket-name/key or /key
    let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    
    // Decode URL encoding
    key = decodeURIComponent(key);
    
    // Remove bucket name if present (format: bucket-name/key)
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (key.startsWith(bucketName + '/')) {
      key = key.substring(bucketName.length + 1);
    }
    
    // For signed URLs, the key might be in the X-Amz-Key query parameter
    // But typically it's in the pathname
    if (key.includes('?')) {
      key = key.split('?')[0];
    }
    
    return key || null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    // Try to extract from the URL string directly as fallback
    try {
      // For object URLs: https://bucket.s3.region.amazonaws.com/key
      // For signed URLs: https://bucket.s3.region.amazonaws.com/key?signature
      const match = url.match(/amazonaws\.com\/([^?]+)/);
      if (match && match[1]) {
        let key = decodeURIComponent(match[1]);
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (key.startsWith(bucketName + '/')) {
          key = key.substring(bucketName.length + 1);
        }
        return key;
      }
    } catch (e) {
      console.error('Fallback key extraction failed:', e);
    }
    return null;
  }
};

// Route to generate signed URL for an existing S3 object
router.get("/signed-url", async (req, res) => {
  try {
    // Check if S3 is configured
    if (!s3) {
      return res.status(503).json({ 
        error: "S3 is not configured. Please configure AWS credentials in .env file." 
      });
    }

    const { key, url } = req.query;
    
    // Extract key from URL if key is not provided directly
    let s3Key = key;
    if (!s3Key && url) {
      s3Key = extractKeyFromUrl(url);
    }
    
    if (!s3Key) {
      return res.status(400).json({ error: "Missing 'key' or 'url' parameter" });
    }

    // Generate a signed URL (valid for 1 hour for on-demand requests)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Expires: 60 * 60 // 1 hour in seconds
    });

    return res.json({
      url: signedUrl,
      key: s3Key,
      expiresIn: 3600 // seconds
    });
  } catch (error) {
    console.error("❌ S3 Signed URL Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

