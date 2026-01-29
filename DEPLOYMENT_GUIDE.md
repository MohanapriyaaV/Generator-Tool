# Docker Deployment Guide for Generator Tool

This guide provides detailed instructions for deploying the Generator Tool application using Docker and Docker Compose.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Building and Running with Docker Compose](#building-and-running-with-docker-compose)
5. [Deployment Architecture](#deployment-architecture)
6. [AWS Deployment Options](#aws-deployment-options)
7. [Troubleshooting](#troubleshooting)
8. [Production Considerations](#production-considerations)

---

## Prerequisites

Before deploying, ensure you have the following installed:

1. **Docker** (version 20.10 or higher)
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify installation: `docker --version`

2. **Docker Compose** (version 2.0 or higher)
   - Usually included with Docker Desktop
   - Verify installation: `docker compose version`

3. **AWS Account** (for S3 storage)
   - AWS Access Key ID
   - AWS Secret Access Key
   - S3 Bucket Name
   - AWS Region

4. **MongoDB** (optional - Docker will use MongoDB container)
   - If using external MongoDB, provide connection string

---

## Project Structure

After setup, your project structure should look like this:

```
Generator-Tool/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── ... (other backend files)
├── frontend/
│   └── vite-project/
│       ├── Dockerfile
│       ├── package.json
│       └── ... (other frontend files)
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .dockerignore
└── DEPLOYMENT_GUIDE.md
```

---

## Environment Variables Setup

### 1. Create Environment File

Create a `.env` file in the root directory of your project:

```bash
# MongoDB Configuration
MONGO_URI=mongodb://mongodb:27017/vista_purchase_app

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Backend Port (optional, defaults to 5000)
PORT=5000
```

### 2. Environment Variables Explained

#### MongoDB Configuration
- **MONGO_URI**: Connection string for MongoDB
  - For Docker Compose: `mongodb://mongodb:27017/vista_purchase_app`
  - For external MongoDB: `mongodb://username:password@host:port/database`
  - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database`

#### AWS S3 Configuration
- **AWS_ACCESS_KEY_ID**: Your AWS access key ID
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key
- **AWS_REGION**: AWS region where your S3 bucket is located (e.g., `us-east-1`, `ap-south-1`)
- **AWS_BUCKET_NAME**: Name of your S3 bucket

#### Getting AWS Credentials

1. Log in to AWS Console
2. Go to IAM → Users → Your User → Security Credentials
3. Create Access Key
4. Copy Access Key ID and Secret Access Key
5. Ensure the user has S3 permissions (see PROJECT_DOCUMENTATION.md for IAM policy)

---

## Building and Running with Docker Compose

### Step 1: Navigate to Project Root

```bash
cd /path/to/Generator-Tool
```

### Step 2: Create Environment File

Create `.env` file with your configuration (see above).

### Step 3: Build and Start Services

```bash
# Build and start all services
docker compose up -d

# Or build without cache (if you have issues)
docker compose build --no-cache
docker compose up -d
```

### Step 4: Verify Services are Running

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Step 5: Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **MongoDB**: localhost:27017 (if needed externally)

---

## Deployment Architecture

### Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                  (generator-network)                    │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   Frontend   │    │   Backend    │    │ MongoDB  │ │
│  │   (Nginx)    │───▶│   (Node.js)  │───▶│          │ │
│  │   Port 80    │    │   Port 5000  │    │ Port     │ │
│  │              │    │              │    │ 27017    │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│         │                    │                         │
│         └────────────────────┘                         │
│              (API Proxy)                                │
└─────────────────────────────────────────────────────────┘
```

### Service Details

#### 1. Frontend Container
- **Image**: Built from `frontend/vite-project/Dockerfile`
- **Base**: nginx:alpine
- **Port**: 80
- **Function**: Serves React app and proxies API requests
- **Volume**: nginx.conf mounted for configuration

#### 2. Backend Container
- **Image**: Built from `backend/Dockerfile`
- **Base**: node:20-alpine
- **Port**: 5000 (internal)
- **Function**: Express API server
- **Dependencies**: MongoDB

#### 3. MongoDB Container
- **Image**: mongo:7.0
- **Port**: 27017
- **Volume**: Persistent data storage
- **Health Check**: Enabled

### Network Flow

1. **User Request** → Frontend (Nginx) on port 80
2. **Static Files** → Served directly by Nginx
3. **API Requests** (`/api/*`) → Proxied to Backend container
4. **Backend** → Connects to MongoDB container
5. **Backend** → Uploads PDFs to AWS S3

---

## AWS Deployment Options

### Option 1: AWS ECS (Elastic Container Service)

#### Prerequisites
- AWS CLI installed and configured
- ECR (Elastic Container Registry) repository created
- ECS cluster created

#### Steps

1. **Build and Push Images to ECR**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build images
docker compose build

# Tag images
docker tag generator-tool-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/generator-backend:latest
docker tag generator-tool-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/generator-frontend:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/generator-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/generator-frontend:latest
```

2. **Create ECS Task Definition**

Create a task definition JSON file that includes:
- Backend container (using ECR image)
- Frontend container (using ECR image)
- MongoDB container (or use AWS DocumentDB)
- Environment variables from AWS Secrets Manager or Parameter Store

3. **Create ECS Service**

Use AWS Console or CLI to create ECS service with:
- Application Load Balancer
- Target groups for frontend and backend
- Security groups
- IAM roles with necessary permissions

4. **Update Environment Variables**

Set environment variables in ECS task definition or use AWS Secrets Manager:
- MongoDB connection string (use AWS DocumentDB or RDS)
- AWS credentials (use IAM roles instead of access keys)
- S3 bucket name

### Option 2: AWS EC2 with Docker Compose

#### Steps

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Instance type: t3.medium or larger
   - Security group: Allow ports 80, 443, 22

2. **Install Docker on EC2**

```bash
# For Amazon Linux 2
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
```

3. **Transfer Project Files**

```bash
# On your local machine
scp -r Generator-Tool ec2-user@<ec2-ip>:/home/ec2-user/

# Or use Git
ssh ec2-user@<ec2-ip>
git clone <your-repo-url>
cd Generator-Tool
```

4. **Configure Environment Variables**

```bash
# Create .env file on EC2
nano .env
# Add your environment variables
```

5. **Start Services**

```bash
docker compose up -d
```

6. **Set Up Nginx Reverse Proxy (Optional)**

If you want to use a domain name, configure Nginx on the host:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: AWS App Runner (Simplified)

AWS App Runner can automatically build and deploy from source:

1. Connect your GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy automatically

**Note**: App Runner requires separate services for frontend and backend.

### Option 4: AWS Elastic Beanstalk

1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create`
4. Deploy: `eb deploy`

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Containers Not Starting

```bash
# Check logs
docker compose logs

# Check container status
docker compose ps

# Restart services
docker compose restart
```

#### 2. Backend Can't Connect to MongoDB

**Error**: `MongoDB Connection Error`

**Solution**:
- Verify MongoDB container is running: `docker compose ps mongodb`
- Check MONGO_URI in .env file
- Ensure MongoDB health check passed: `docker compose logs mongodb`

#### 3. Frontend Can't Connect to Backend

**Error**: `Cannot connect to server`

**Solution**:
- Verify backend is running: `docker compose ps backend`
- Check nginx.conf proxy_pass URL
- Verify network connectivity: `docker network inspect generator-network`
- Check backend logs: `docker compose logs backend`

#### 4. AWS S3 Upload Fails

**Error**: `S3 upload functionality will not work`

**Solution**:
- Verify AWS credentials in .env file
- Check IAM permissions (see PROJECT_DOCUMENTATION.md)
- Verify bucket name and region
- Check backend logs: `docker compose logs backend`

#### 5. Port Already in Use

**Error**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution**:
```bash
# Change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead

# Or stop the service using port 80
```

#### 6. Build Fails

**Error**: `npm install` fails

**Solution**:
```bash
# Clean build
docker compose down
docker system prune -a
docker compose build --no-cache
```

#### 7. Frontend Shows Blank Page

**Solution**:
- Check browser console for errors
- Verify VITE_API_URL is correct
- Check nginx logs: `docker compose logs frontend`
- Verify build succeeded: `docker compose logs frontend | grep build`

---

## Production Considerations

### 1. Security

#### Use Environment Variables Securely
- Never commit `.env` file to Git
- Use AWS Secrets Manager or Parameter Store for production
- Use IAM roles instead of access keys when possible

#### Update Nginx Configuration
- Add SSL/TLS certificates for HTTPS
- Configure security headers
- Set up rate limiting
- Enable firewall rules

#### MongoDB Security
- Use authentication: `MONGO_URI=mongodb://username:password@mongodb:27017/database`
- Enable MongoDB authentication
- Use MongoDB Atlas for managed database

### 2. Performance

#### Optimize Docker Images
- Use multi-stage builds (already implemented)
- Minimize image size
- Use .dockerignore files

#### Scaling
```bash
# Scale backend service
docker compose up -d --scale backend=3

# Use load balancer in production
```

#### Caching
- Nginx caching for static assets (already configured)
- Consider CDN for frontend assets
- MongoDB indexing for queries

### 3. Monitoring

#### Health Checks
- Health checks are configured in docker-compose.yml
- Monitor container health: `docker compose ps`

#### Logging
```bash
# View all logs
docker compose logs -f

# Export logs
docker compose logs > logs.txt
```

#### Use Monitoring Tools
- AWS CloudWatch
- Prometheus + Grafana
- ELK Stack

### 4. Backup and Recovery

#### MongoDB Backup
```bash
# Backup MongoDB data
docker exec generator-mongodb mongodump --out /data/backup

# Restore MongoDB data
docker exec generator-mongodb mongorestore /data/backup
```

#### Volume Backup
```bash
# Backup volumes
docker run --rm -v generator-tool_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

### 5. SSL/TLS Setup

#### Using Let's Encrypt with Certbot

1. Install Certbot on host or use certbot container
2. Obtain certificates
3. Update nginx.conf to use SSL
4. Configure automatic renewal

#### Example nginx.conf with SSL

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}
```

### 6. Domain Configuration

1. **Point Domain to Server**
   - Create A record: `your-domain.com` → Server IP
   - Create CNAME: `www.your-domain.com` → `your-domain.com`

2. **Update docker-compose.yml**
   ```yaml
   frontend:
     environment:
       - VITE_API_URL=https://your-domain.com/api
   ```

3. **Update nginx.conf**
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

---

## Quick Reference Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart a service
docker compose restart backend

# Rebuild and restart
docker compose up -d --build

# Remove everything (including volumes)
docker compose down -v

# Execute command in container
docker compose exec backend sh
docker compose exec mongodb mongosh

# Check resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

---

## Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Verify environment variables
3. Check network connectivity
4. Review this guide's troubleshooting section
5. Check PROJECT_DOCUMENTATION.md for application-specific issues

---

**Last Updated**: January 2026
**Version**: 1.0
