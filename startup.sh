#!/bin/bash

# Azure Web App startup script
echo "Starting Azure Web App..."

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-8080}

# Optimize node for production
export NODE_OPTIONS="--max-old-space-size=1024"

# Start the application
echo "Starting Next.js application on port $PORT"
npm start
