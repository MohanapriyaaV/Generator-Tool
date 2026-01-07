/**
 * SAFE CLEANUP SCRIPT FOR INVOICES
 * 
 * This script will:
 * 1. List all invoices from the database
 * 2. Delete PDF files from AWS S3 (from the Invoice folder)
 * 3. Delete all invoice records from MongoDB
 * 
 * IMPORTANT: This is a DESTRUCTIVE operation. Use with caution!
 * 
 * Usage:
 *   node backend/scripts/cleanupInvoices.js
 * 
 * The script will ask for confirmation before proceeding.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import { Invoice } from '../models/invoice_model.js';
import s3 from '../s3config.js';

dotenv.config();

// Create readline interface for interactive confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask for confirmation
const askConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim() === 'yes' || answer.toLowerCase().trim() === 'y');
    });
  });
};

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
    let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    
    // Decode URL encoding
    key = decodeURIComponent(key);
    
    // Remove bucket name if present
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (key.startsWith(bucketName + '/')) {
      key = key.substring(bucketName.length + 1);
    }
    
    // Remove query parameters
    if (key.includes('?')) {
      key = key.split('?')[0];
    }
    
    return key || null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    // Try regex fallback
    try {
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

// Function to delete a file from S3
const deleteFromS3 = async (key) => {
  if (!s3) {
    console.warn('⚠️  S3 is not configured. Skipping S3 deletion.');
    return false;
  }
  
  if (!key) {
    console.warn('⚠️  No S3 key provided. Skipping.');
    return false;
  }
  
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    console.log(`✅ Deleted from S3: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting ${key} from S3:`, error.message);
    return false;
  }
};

// Main cleanup function
const cleanupInvoices = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vista_purchase_app';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all invoices
    console.log('\n📋 Fetching all invoices...');
    const invoices = await Invoice.find({});
    const totalCount = invoices.length;
    
    console.log(`\n📊 Found ${totalCount} invoice(s) in database`);
    
    if (totalCount === 0) {
      console.log('✅ No invoices to clean up. Exiting.');
      await mongoose.disconnect();
      return;
    }
    
    // Show summary
    console.log('\n📝 Summary of invoices to be deleted:');
    invoices.forEach((inv, index) => {
      console.log(`  ${index + 1}. Invoice #${inv.invoiceNumber} (ID: ${inv._id})`);
      if (inv.s3Url) {
        console.log(`     S3 URL: ${inv.s3Url.substring(0, 80)}...`);
      }
    });
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete:');
    console.log(`   - ${totalCount} invoice record(s) from MongoDB`);
    console.log('   - All associated PDF files from AWS S3');
    console.log('   - This action CANNOT be undone!\n');
    
    // Check for --confirm flag (for non-interactive use)
    const args = process.argv.slice(2);
    const hasConfirmFlag = args.includes('--confirm');
    
    let confirmed = false;
    
    if (hasConfirmFlag) {
      confirmed = true;
      console.log('✅ --confirm flag detected. Proceeding with cleanup...\n');
    } else {
      // Interactive confirmation
      confirmed = await askConfirmation('Type "yes" to confirm and proceed with deletion: ');
      if (!confirmed) {
        console.log('\n❌ Cleanup cancelled by user.');
        await mongoose.disconnect();
        rl.close();
        return;
      }
      console.log('\n✅ Confirmation received. Proceeding with cleanup...\n');
    }
    
    console.log('🗑️  Starting cleanup process...\n');
    
    // Step 1: Delete PDFs from S3
    let s3DeletedCount = 0;
    let s3FailedCount = 0;
    let s3SkippedCount = 0;
    
    if (s3) {
      console.log('📦 Step 1: Deleting PDFs from AWS S3...');
      for (const invoice of invoices) {
        if (invoice.s3Url) {
          const s3Key = extractKeyFromUrl(invoice.s3Url);
          if (s3Key) {
            const deleted = await deleteFromS3(s3Key);
            if (deleted) {
              s3DeletedCount++;
            } else {
              s3FailedCount++;
            }
          } else {
            console.warn(`⚠️  Could not extract S3 key from URL: ${invoice.s3Url}`);
            s3SkippedCount++;
          }
        } else {
          s3SkippedCount++;
        }
      }
      console.log(`\n📦 S3 Deletion Summary:`);
      console.log(`   ✅ Deleted: ${s3DeletedCount}`);
      console.log(`   ❌ Failed: ${s3FailedCount}`);
      console.log(`   ⏭️  Skipped: ${s3SkippedCount}`);
    } else {
      console.log('⚠️  S3 not configured. Skipping S3 deletion.');
    }
    
    // Step 2: Delete all records from MongoDB
    console.log('\n🗄️  Step 2: Deleting records from MongoDB...');
    const deleteResult = await Invoice.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} record(s) from MongoDB`);
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`\n📊 Final Summary:`);
    console.log(`   - Database records deleted: ${deleteResult.deletedCount}`);
    if (s3) {
      console.log(`   - S3 files deleted: ${s3DeletedCount}`);
      console.log(`   - S3 files failed: ${s3FailedCount}`);
      console.log(`   - S3 files skipped: ${s3SkippedCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    rl.close();
  }
};

// Run the cleanup if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('cleanupInvoices.js');

if (isMainModule) {
  cleanupInvoices()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { cleanupInvoices };

