#!/bin/bash

# Azure Web App startup script
echo "Starting application..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-8080}

# Optimize node for production
export NODE_OPTIONS="--max-old-space-size=1024"

echo "Starting Next.js on port $PORT..."
exec npm start
