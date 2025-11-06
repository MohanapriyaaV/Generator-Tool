import AWS from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, '.env') });

if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
    process.exit(1);
}

// Debug: Log environment variables (remove in production)
console.log('🔍 Checking AWS configurations...');
const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_BUCKET_NAME'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Missing ${varName}`);
        throw new Error(`Missing required environment variable: ${varName}`);
    }
    console.log(`✅ Found ${varName}`);
});

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Test S3 connection
const testConnection = async () => {
    try {
        await s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise();
        console.log('✅ Successfully connected to S3 bucket:', process.env.AWS_BUCKET_NAME);
    } catch (error) {
        console.error('❌ Failed to connect to S3:', error.message);
        throw error;
    }
};

testConnection();

export default s3;