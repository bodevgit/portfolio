#!/bin/bash
# Simple deployment script for your portfolio site

# 1. Pull latest changes
git pull

# 2. Install dependencies
npm ci --production

# 3. Build any assets (if needed)
# npm run build

# 4. Restart the application (using PM2 as process manager)
# Replace 'portfolio' with your PM2 app name
# pm2 restart portfolio

echo "Deployment complete!"
