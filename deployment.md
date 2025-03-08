# Deployment Guide for Portfolio Site

This document provides detailed instructions for deploying your space-themed portfolio site to Render.com with your bodev.dev domain.

## Setting Up GitHub Repository

1. Initialize git in your project folder (if not already done):
   ```bash
   git init
   ```

2. Add and commit your files:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

3. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Repository name: portfolio (or your preferred name)
   - Description: Space-themed portfolio website with document management
   - Visibility: Public
   - Do not initialize with README, .gitignore, or license (we've created these already)
   - Click "Create repository"

4. Link your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/bodevgit/portfolio.git
   git push -u origin main
   ```

## Deploying to Render.com

### 1. Create a New Web Service

1. Sign up/login to [Render](https://render.com/)
2. From your dashboard, click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: portfolio
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm ci --production`
   - **Start Command**: `node server.js`

### 2. Configure Environment Variables

In the Render dashboard for your service, add these environment variables:

- `NODE_ENV`: production
- `PORT`: 10000
- `DB_PATH`: /opt/render/project/src/data/documents.db
- `RENDER_MOUNT_DIR`: /opt/render/project/src/data

### 3. Set Up Persistent Storage

1. In your service settings, find "Disks"
2. Click "Add Disk"
3. Configure:
   - **Name**: portfolio-data
   - **Mount Path**: /opt/render/project/src/data
   - **Size**: 1 GB (increase if needed)

### 4. Connect Custom Domain

1. In your service dashboard, go to "Settings" → "Custom Domains"
2. Click "Add Custom Domain"
3. Enter: bodev.dev
4. Follow Render's instructions to add the required DNS records at Namecheap

## Configuring DNS at Namecheap

1. Log in to your Namecheap account
2. Go to "Domain List" → bodev.dev → "Manage" → "Advanced DNS"
3. Add these records (using values from Render):
   - Type: CNAME, Host: www, Value: [your-render-url].onrender.com, TTL: Automatic
   - Type: ALIAS/ANAME, Host: @, Value: [your-render-url].onrender.com, TTL: Automatic

## Post-Deployment Steps

### Security

1. Change the default admin credentials (admin/portfolio2025):
   - Log in as admin
   - Go to account settings or use database management to update credentials

### Testing

Verify that all features are working correctly:
- Document upload and download
- User login (both admin and regular users)
- Planning system functionality
- Mobile responsiveness

### Maintenance

- Monitor your app using Render's dashboard
- Set up automatic database backups
- Implement proper logging

## Troubleshooting

### Database Issues
- Check if your persistent disk is correctly mounted
- Verify that the DB_PATH environment variable is correct

### Upload Problems
- Ensure the uploads directory is created in the persistent disk
- Check file permissions

### Domain Connection Issues
- Allow 24-48 hours for DNS changes to propagate
- Verify that all DNS records are correctly set up at Namecheap

## Support

If you encounter issues, check:
- Render's service logs
- Your application logs
- Render's status page and documentation
