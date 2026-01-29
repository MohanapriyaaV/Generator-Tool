# Quick Start Guide - Docker Deployment

## Prerequisites
- Docker and Docker Compose installed
- AWS credentials (Access Key ID, Secret Access Key, S3 Bucket Name, Region)

## Step-by-Step Deployment

### 1. Create Environment File

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://mongodb:27017/vista_purchase_app
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
```

### 2. Start Services

```bash
docker compose up -d
```

### 3. Verify Deployment

- **Frontend**: Open http://localhost in your browser
- **Backend API**: http://localhost/api
- **Check logs**: `docker compose logs -f`

### 4. Stop Services

```bash
docker compose down
```

## Architecture

```
User → Frontend (Nginx:80) → Backend API (Node.js:5000) → MongoDB (27017)
                                      ↓
                                   AWS S3
```

## Important Notes

1. **API URL**: The frontend is configured to use `/api` which is proxied to the backend by Nginx
2. **MongoDB**: Data persists in Docker volume `mongodb_data`
3. **AWS S3**: Ensure your AWS credentials have proper S3 permissions
4. **Ports**: 
   - Port 80: Frontend (Nginx)
   - Port 5000: Backend (internal only, proxied via Nginx)
   - Port 27017: MongoDB (internal only)

## Troubleshooting

- **Containers not starting**: Check logs with `docker compose logs`
- **Can't connect to backend**: Verify backend is running with `docker compose ps`
- **S3 upload fails**: Check AWS credentials and IAM permissions

For detailed information, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
