# Cleanup Scripts

## Overview
These scripts safely delete data from:
1. **MongoDB Database** - All records from the specified collection
2. **AWS S3 Storage** - All associated PDF files

Available cleanup scripts:
- `cleanupProformaInvoices.js` - Cleans proforma invoices
- `cleanupQuotations.js` - Cleans quotations
- `cleanupInvoices.js` - Cleans invoices

## ⚠️ WARNING
**These are DESTRUCTIVE operations that cannot be undone!** 
Use these scripts only when you want to completely clean up test data.

## Prerequisites
1. Ensure your `.env` file has the correct MongoDB and AWS credentials
2. Make sure you have a backup if you need to recover any data later
3. Verify you're connected to the correct database and S3 bucket

## Usage

### Option 1: Interactive Mode (Recommended)
Run the script and it will ask for confirmation:

**Proforma Invoices:**
```bash
cd backend
node scripts/cleanupProformaInvoices.js
```

**Quotations:**
```bash
cd backend
node scripts/cleanupQuotations.js
```

**Invoices:**
```bash
cd backend
node scripts/cleanupInvoices.js
```

Each script will:
1. Show you a summary of all records to be deleted
2. Ask for confirmation (type "yes" to proceed)
3. Delete PDFs from S3
4. Delete records from MongoDB
5. Show a final summary

### Option 2: Non-Interactive Mode (with --confirm flag)
If you're sure and want to skip the interactive prompt:

**Proforma Invoices:**
```bash
cd backend
node scripts/cleanupProformaInvoices.js --confirm
```

**Quotations:**
```bash
cd backend
node scripts/cleanupQuotations.js --confirm
```

**Invoices:**
```bash
cd backend
node scripts/cleanupInvoices.js --confirm
```

## What the Scripts Do

Each script follows the same pattern:

1. **Connects to MongoDB** using `MONGODB_URI` from `.env`
2. **Fetches all records** from the respective collection (ProformaInvoice, Quotation, or Invoice)
3. **Shows a summary** of what will be deleted
4. **Asks for confirmation** (unless `--confirm` flag is used)
5. **Deletes PDFs from S3**:
   - Extracts S3 keys from `s3Url` fields in database
   - Deletes each PDF file from AWS S3
   - Reports success/failure for each file
6. **Deletes all records** from MongoDB collection
7. **Shows final summary** of what was deleted

## Example Output

**Proforma Invoice Cleanup:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Fetching all proforma invoices...
📊 Found 5 proforma invoice(s) in database
```

**Quotation Cleanup:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Fetching all quotations...
📊 Found 10 quotation(s) in database
```

**Invoice Cleanup:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Fetching all invoices...
📊 Found 8 invoice(s) in database

📝 Summary of invoices to be deleted:
  1. Invoice #PI25260035 (ID: 507f1f77bcf86cd799439011)
     S3 URL: https://bucket.s3.region.amazonaws.com/Generator tool/ProformaInvoice/1234567890_Invoice_PI25260035_2026-01-01.pdf...
  2. Invoice #PI25260036 (ID: 507f1f77bcf86cd799439012)
     S3 URL: https://bucket.s3.region.amazonaws.com/Generator tool/ProformaInvoice/1234567891_Invoice_PI25260036_2026-01-01.pdf...

⚠️  WARNING: This will permanently delete:
   - 5 proforma invoice record(s) from MongoDB
   - All associated PDF files from AWS S3
   - This action CANNOT be undone!

Type "yes" to confirm and proceed with deletion: yes

✅ Confirmation received. Proceeding with cleanup...

📦 Step 1: Deleting PDFs from AWS S3...
✅ Deleted from S3: Generator tool/ProformaInvoice/1234567890_Invoice_PI25260035_2026-01-01.pdf
✅ Deleted from S3: Generator tool/ProformaInvoice/1234567891_Invoice_PI25260036_2026-01-01.pdf

📦 S3 Deletion Summary:
   ✅ Deleted: 5
   ❌ Failed: 0
   ⏭️  Skipped: 0

🗄️  Step 2: Deleting records from MongoDB...
✅ Deleted 5 record(s) from MongoDB

✅ Cleanup completed successfully!

📊 Final Summary:
   - Database records deleted: 5
   - S3 files deleted: 5
   - S3 files failed: 0
   - S3 files skipped: 0

🔌 Disconnected from MongoDB
✅ Script completed successfully
```

## Safety Features

1. **Confirmation Required**: Script asks for explicit confirmation before proceeding
2. **Summary Display**: Shows what will be deleted before deletion
3. **Error Handling**: Continues even if some S3 deletions fail
4. **Detailed Logging**: Reports success/failure for each operation

## Troubleshooting

### S3 Deletion Fails
- Check AWS credentials in `.env`
- Verify S3 bucket permissions
- Check if files still exist in S3
- The script will continue even if S3 deletion fails

### MongoDB Connection Fails
- Verify `MONGODB_URI` in `.env`
- Check if MongoDB is running
- Verify network connectivity

### Script Doesn't Run
- Make sure you're in the `backend` directory
- Ensure Node.js is installed
- Check that all dependencies are installed (`npm install`)

## Manual Cleanup (Alternative)

If you prefer to do it manually:

### MongoDB (using MongoDB Compass or mongo shell):
```javascript
use vista_purchase_app
db.proformainvoices.deleteMany({})
```

### AWS S3 (using AWS Console):
1. Go to AWS S3 Console
2. Navigate to your bucket
3. Go to `Generator tool/ProformaInvoice/` folder
4. Select all files and delete

## Notes

- Each script only deletes its specific document type:
  - `cleanupProformaInvoices.js` - Only deletes proforma invoices
  - `cleanupQuotations.js` - Only deletes quotations
  - `cleanupInvoices.js` - Only deletes invoices
- If S3 is not configured, the script will skip S3 deletion but still delete database records
- The scripts preserve counters for sequential numbering (in the `counters` collection)
- Run each script separately if you need to clean multiple document types

