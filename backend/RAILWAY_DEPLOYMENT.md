# 🚂 Railway Deployment Guide

This guide will help you deploy your Insurance Helpdesk backend to Railway using Docker.

## 📋 Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Railway account (free tier available)
- ✅ Docker Hub account (for image registry)
- ✅ Supabase project set up
- ✅ All API keys ready (Google AI, Groq, JIRA, Gmail)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Environment

1. **Update the build script** with your Docker Hub username:
   ```bash
   # Edit build-docker.sh (Linux/Mac) or build-docker.bat (Windows)
   # Replace "your-dockerhub-username" with your actual Docker Hub username
   ```

2. **Ensure all environment variables** are ready for Railway:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_API_KEY`
   - `GROQ_API_KEY`
   - `JIRA_SERVER`, `JIRA_USERNAME`, `JIRA_API_TOKEN`
   - `SENDER_EMAIL`, `SENDER_PASSWORD`
   - `FLASK_SECRET_KEY`

### Step 2: Build Docker Image

#### Option A: Using Build Script (Recommended)
```bash
# Linux/Mac
chmod +x build-docker.sh
./build-docker.sh

# Windows
build-docker.bat
```

#### Option B: Manual Build
```bash
# Build the image
docker build -t insurance-helpdesk-backend:latest .

# Tag for Docker Hub
docker tag insurance-helpdesk-backend:latest your-username/insurance-helpdesk-backend:latest
```

### Step 3: Test Locally (Optional but Recommended)

```bash
# Test the image locally
docker run -p 8001:8001 \
  -e USE_SUPABASE=true \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_ANON_KEY=your_anon_key \
  -e GOOGLE_API_KEY=your_google_key \
  -e GROQ_API_KEY=your_groq_key \
  insurance-helpdesk-backend:latest
```

Test the health endpoint: `http://localhost:8001/health`

### Step 4: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push your-username/insurance-helpdesk-backend:latest
```

### Step 5: Deploy on Railway

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from Docker Hub"

3. **Configure the Service**:
   - **Image Name**: `your-username/insurance-helpdesk-backend:latest`
   - **Service Name**: `insurance-helpdesk-backend`

4. **Set Environment Variables**:
   ```
   USE_SUPABASE=true
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GOOGLE_API_KEY=your_google_api_key
   GROQ_API_KEY=your_groq_api_key
   JIRA_SERVER=your_jira_server
   JIRA_USERNAME=your_jira_username
   JIRA_API_TOKEN=your_jira_token
   JIRA_PROJECT_KEY=your_jira_project_key
   SENDER_EMAIL=your_email@gmail.com
   SENDER_PASSWORD=your_app_password
   FLASK_SECRET_KEY=your_secret_key
   DEBUG=false
   HOST=0.0.0.0
   PORT=8001
   ```

5. **Configure Persistent Storage**:
   - Railway automatically handles persistent volumes
   - Your ChromaDB data will be stored in `/app/data/`
   - Data persists across deployments

6. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Railway will provide a public URL

### Step 6: Verify Deployment

1. **Check Health Endpoint**:
   ```
   GET https://your-railway-url.railway.app/health
   ```

2. **Test API Endpoints**:
   ```bash
   # Test chat endpoint
   curl -X POST https://your-railway-url.railway.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"query": "Hello", "user_id": "test-user"}'
   ```

3. **Check Logs**:
   - Go to Railway dashboard
   - Click on your service
   - View deployment logs

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `USE_SUPABASE` | Enable Supabase integration | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GOOGLE_API_KEY` | Google AI API key | Yes |
| `GROQ_API_KEY` | Groq API key | Yes |
| `JIRA_SERVER` | JIRA server URL | Yes |
| `JIRA_USERNAME` | JIRA username/email | Yes |
| `JIRA_API_TOKEN` | JIRA API token | Yes |
| `JIRA_PROJECT_KEY` | JIRA project key | Yes |
| `SENDER_EMAIL` | Gmail address for sending emails | Yes |
| `SENDER_PASSWORD` | Gmail app password | Yes |
| `FLASK_SECRET_KEY` | Flask secret key | Yes |
| `DEBUG` | Debug mode (set to false) | Yes |
| `HOST` | Host (set to 0.0.0.0) | Yes |
| `PORT` | Port (Railway sets this) | Yes |

### Persistent Storage

Railway automatically creates persistent volumes for:
- `/app/data/faq_database/` - ChromaDB FAQ vectors
- `/app/data/pdf_vectors/` - ChromaDB PDF vectors
- `/app/data/embedding_models/` - Cached ML models
- `/app/data/checkpoints.sqlite` - LangGraph conversation state

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Docker Desktop is running
   - Verify all files are in the correct directory
   - Check Dockerfile syntax

2. **Deployment Fails**:
   - Verify all environment variables are set
   - Check Railway logs for specific errors
   - Ensure Docker image is publicly accessible

3. **Health Check Fails**:
   - Check if all services are properly initialized
   - Verify database connections
   - Check API key validity

4. **ChromaDB Issues**:
   - Ensure persistent volumes are working
   - Check if FAQ database is properly initialized
   - Verify embedding models are cached

### Debug Commands

```bash
# Check container logs
docker logs <container_id>

# Test health endpoint
curl -f http://localhost:8001/health

# Check environment variables
docker exec <container_id> env
```

## 📊 Monitoring

### Railway Dashboard
- View deployment status
- Monitor resource usage
- Check logs in real-time
- View metrics and performance

### Health Endpoint
- `GET /health` - Returns service status
- Includes database and ChromaDB health
- Useful for monitoring and debugging

## 🔄 Updates and Redeployment

### To Update Your Deployment:

1. **Make code changes**
2. **Rebuild Docker image**:
   ```bash
   ./build-docker.sh
   ```
3. **Push to Docker Hub**:
   ```bash
   docker push your-username/insurance-helpdesk-backend:latest
   ```
4. **Redeploy on Railway**:
   - Railway will automatically detect the new image
   - Or manually trigger redeployment

### Data Persistence
- Your ChromaDB data persists across deployments
- Conversation history is maintained
- FAQ database remains intact
- PDF vectors are preserved

## 🎯 Success Checklist

- [ ] Docker image builds successfully
- [ ] Image pushes to Docker Hub
- [ ] Railway deployment completes
- [ ] Health endpoint returns 200
- [ ] API endpoints respond correctly
- [ ] ChromaDB data persists
- [ ] Supabase connection works
- [ ] AI agents function properly
- [ ] File uploads work
- [ ] Frontend can connect to backend

## 📞 Support

If you encounter issues:
1. Check Railway logs first
2. Verify all environment variables
3. Test health endpoint
4. Check Docker image locally
5. Review this guide for common solutions

---

**Your backend is now ready for Railway deployment!** 🚂✨

