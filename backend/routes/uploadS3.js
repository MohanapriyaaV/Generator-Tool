// routes/uploadS3.js
import express from "express";
import multer from "multer";
import s3 from "../s3config.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
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
    });
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

