# Railway Deployment Guide for Insurance Helpdesk Backend

## Overview
This guide will help you deploy your Insurance Helpdesk backend to Railway.

## Prerequisites
- Railway account
- All required API keys and credentials
- Your repository connected to Railway

## Configuration Files Created
The following files have been created to help Railway deploy your backend:

1. **railway.json** - Railway deployment configuration
2. **nixpacks.toml** - Build configuration for Railway
3. **start.sh** - Startup script
4. **.railwayignore** - Files to exclude from deployment

## Environment Variables Setup

You need to set the following environment variables in your Railway project:

### Required Environment Variables

```bash
# Flask Configuration
FLASK_SECRET_KEY=your_secret_key_here
DEBUG=False
PORT=8001

# Database Configuration (Supabase)
USE_SUPABASE=true
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Keys
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
LANGCHAIN_API_KEY=your_langchain_api_key

# JIRA Configuration
JIRA_SERVER=your_jira_server_url
JIRA_USERNAME=your_jira_username
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=your_jira_project_key

# Email Configuration
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password

# LangSmith Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=insurance-helpdesk
```

### Optional Environment Variables

```bash
# Vector Store Paths (will use defaults if not set)
FAQ_DB_PATH=/app/backend/faq_database
PDF_DB_PATH=/app/backend/uploads/pdf_vectors

# Collection Names (will use defaults if not set)
FAQ_COLLECTION_NAME=faq_collection
PDF_COLLECTION_NAME=pdf_documents
```

## Deployment Steps

### 1. Connect Repository to Railway
1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `insurance-helpdesk` repository

### 2. Configure Environment Variables
1. In your Railway project dashboard, go to "Variables"
2. Add all the environment variables listed above
3. Make sure to use your actual API keys and credentials

### 3. Deploy
1. Railway should automatically detect the configuration files
2. Click "Deploy" or push changes to trigger deployment
3. Monitor the deployment logs for any issues

### 4. Verify Deployment
1. Once deployed, Railway will provide a URL
2. Test the API endpoint: `https://your-app.railway.app/api/chat`
3. Check the health endpoint: `https://your-app.railway.app/api/chat`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies in `requirements.txt` are compatible
   - Verify Python version compatibility

2. **Environment Variable Issues**
   - Ensure all required environment variables are set
   - Check for typos in variable names

3. **Database Connection Issues**
   - Verify Supabase credentials are correct
   - Check that Supabase project is active

4. **API Key Issues**
   - Verify all API keys are valid and have proper permissions
   - Check rate limits and quotas

### Logs and Debugging
- Use Railway's built-in logging to debug issues
- Check the deployment logs for specific error messages
- Monitor the application logs for runtime errors

## Post-Deployment

### 1. Update Frontend Configuration
Update your frontend to point to the Railway backend URL:
```javascript
const API_BASE_URL = 'https://your-app.railway.app';
```

### 2. Test All Endpoints
- `/api/chat` - Main chat endpoint
- `/api/login/` - Authentication
- `/api/user/policies/<user_id>` - User policies
- `/api/tickets/all` - JIRA tickets
- `/api/metrics` - LangSmith metrics

### 3. Monitor Performance
- Use Railway's metrics dashboard
- Monitor LangSmith for AI performance
- Check Supabase for database performance

## Security Considerations

1. **Environment Variables**
   - Never commit API keys to your repository
   - Use Railway's secure environment variable storage
   - Rotate API keys regularly

2. **CORS Configuration**
   - Update CORS settings in `app.py` to include your frontend domain
   - Remove localhost origins for production

3. **Database Security**
   - Use Supabase's built-in security features
   - Implement proper RLS (Row Level Security) policies

## Scaling Considerations

1. **Database**
   - Monitor Supabase usage and upgrade plan if needed
   - Consider connection pooling for high traffic

2. **AI Services**
   - Monitor API usage and costs
   - Implement caching for frequently asked questions

3. **File Storage**
   - Consider using Supabase Storage for PDF uploads
   - Implement file size limits and validation

## Support

If you encounter issues:
1. Check Railway's documentation
2. Review the deployment logs
3. Verify all environment variables are set correctly
4. Test locally with the same configuration
