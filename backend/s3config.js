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

let hasAllCredentials = true;
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.warn(`⚠️  Missing ${varName} - S3 upload will be disabled`);
        hasAllCredentials = false;
    } else {
        console.log(`✅ Found ${varName}`);
    }
});

// Only configure AWS if all credentials are present
let s3 = null;
if (hasAllCredentials) {
    try {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });

        s3 = new AWS.S3();

        // Test S3 connection (optional - won't crash server if it fails)
        const testConnection = async () => {
            try {
                await s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise();
                console.log('✅ Successfully connected to S3 bucket:', process.env.AWS_BUCKET_NAME);
            } catch (error) {
                const errorMessage = error.message || error.code || error.toString() || 'Unknown error';
                const errorDetails = {
                    message: errorMessage,
                    code: error.code || 'N/A',
                    statusCode: error.statusCode || 'N/A',
                    region: process.env.AWS_REGION,
                    bucket: process.env.AWS_BUCKET_NAME
                };
                console.warn('⚠️  S3 connection test failed (server will continue)');
                console.warn('⚠️  Error details:', JSON.stringify(errorDetails, null, 2));
                console.warn('⚠️  S3 upload functionality will not work until S3 is properly configured.');
                
                if (error.statusCode === 403) {
                    console.warn('');
                    console.warn('🔒 PERMISSIONS ISSUE DETECTED (403 Forbidden)');
                    console.warn('   This is NOT related to AWS_UPLOAD_FOLDER - it\'s an IAM permissions issue.');
                    console.warn('   The error occurs when testing bucket access (headBucket), which doesn\'t use folders.');
                    console.warn('');
                    console.warn('   Your IAM user needs the following S3 permissions:');
                    console.warn('');
                    console.warn('   Required IAM Policy:');
                    console.warn('   {');
                    console.warn('     "Version": "2012-10-17",');
                    console.warn('     "Statement": [');
                    console.warn('       {');
                    console.warn('         "Effect": "Allow",');
                    console.warn('         "Action": [');
                    console.warn('           "s3:PutObject",');
                    console.warn('           "s3:GetObject",');
                    console.warn('           "s3:ListBucket",');
                    console.warn('           "s3:HeadBucket"');
                    console.warn('         ],');
                    console.warn(`         "Resource": [`);
                    console.warn(`           "arn:aws:s3:::${process.env.AWS_BUCKET_NAME}",`);
                    console.warn(`           "arn:aws:s3:::${process.env.AWS_BUCKET_NAME}/*"`);
                    console.warn('         ]');
                    console.warn('       }');
                    console.warn('     ]');
                    console.warn('   }');
                    console.warn('');
                    console.warn('   Steps to fix:');
                    console.warn('   1. Go to AWS IAM Console → Users → [Your User] → Permissions');
                    console.warn('   2. Attach a policy with the above permissions');
                    console.warn('   3. Or use the managed policy: AmazonS3FullAccess (for testing)');
                    console.warn('');
                    if (process.env.AWS_UPLOAD_FOLDER) {
                        console.warn('   Note: AWS_UPLOAD_FOLDER is set but not used in PDF uploads.');
                        console.warn('   PDF uploads use folder names: "quotations", "invoices", "proforma-invoices"');
                        console.warn('');
                    }
                } else {
                    console.warn('⚠️  Common issues:');
                    console.warn('   - Invalid AWS credentials (check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)');
                    console.warn('   - Bucket does not exist or wrong bucket name');
                    console.warn('   - Incorrect AWS region');
                    console.warn('   - IAM user does not have S3 permissions');
                }
                // Don't throw error - allow server to continue without S3
            }
        };

        // Test connection asynchronously without blocking server startup
        testConnection().catch(() => {
            // Silently handle any errors - server should continue
        });
    } catch (error) {
        console.warn('⚠️  Failed to initialize S3 (server will continue):', error.message);
        s3 = null;
    }
} else {
    console.warn('⚠️  S3 is not configured - upload functionality will be disabled');
}

export default s3;