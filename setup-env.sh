#!/bin/bash

# 🔧 Azure Environment Variables Setup Helper
# This script helps you configure environment variables for your Azure Web App

set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-uxtester-platform_group}"
APP_NAME="${AZURE_APP_NAME:-uxtester-platform}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Azure Environment Setup Helper          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ Found .env.local file${NC}"
    echo -e "${YELLOW}Do you want to use values from .env.local? [Y/n]: ${NC}"
    read -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        # Source the .env.local file
        export $(grep -v '^#' .env.local | xargs)
        echo -e "${GREEN}✅ Loaded environment from .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found. You'll need to enter values manually.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Current Configuration:${NC}"
echo -e "   Resource Group: ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "   App Name: ${GREEN}$APP_NAME${NC}"
echo ""

# Prompt for values if not set
if [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Enter AZURE_OPENAI_API_KEY: ${NC}"
    read AZURE_OPENAI_API_KEY
fi

if [ -z "$AZURE_OPENAI_ENDPOINT" ]; then
    echo -e "${YELLOW}Enter AZURE_OPENAI_ENDPOINT (e.g., https://your-resource.openai.azure.com/): ${NC}"
    read AZURE_OPENAI_ENDPOINT
fi

if [ -z "$AZURE_OPENAI_DEPLOYMENT" ]; then
    echo -e "${YELLOW}Enter AZURE_OPENAI_DEPLOYMENT: ${NC}"
    read AZURE_OPENAI_DEPLOYMENT
fi

if [ -z "$AZURE_OPENAI_API_VERSION" ]; then
    AZURE_OPENAI_API_VERSION="2024-02-15-preview"
fi

if [ -z "$AZURE_MAX_CONCURRENCY" ]; then
    AZURE_MAX_CONCURRENCY="3"
fi

# Show what will be configured
echo ""
echo -e "${BLUE}📝 Environment Variables to Configure:${NC}"
echo -e "   AZURE_OPENAI_API_KEY: ${GREEN}${AZURE_OPENAI_API_KEY:0:10}...${NC}"
echo -e "   AZURE_OPENAI_ENDPOINT: ${GREEN}$AZURE_OPENAI_ENDPOINT${NC}"
echo -e "   AZURE_OPENAI_DEPLOYMENT: ${GREEN}$AZURE_OPENAI_DEPLOYMENT${NC}"
echo -e "   AZURE_OPENAI_API_VERSION: ${GREEN}$AZURE_OPENAI_API_VERSION${NC}"
echo -e "   AZURE_MAX_CONCURRENCY: ${GREEN}$AZURE_MAX_CONCURRENCY${NC}"
echo -e "   NODE_ENV: ${GREEN}production${NC}"
echo -e "   SCM_DO_BUILD_DURING_DEPLOYMENT: ${GREEN}true${NC}"

# Optional providers
if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "   OPENAI_API_KEY: ${GREEN}${OPENAI_API_KEY:0:10}...${NC}"
fi

if [ -n "$GEMINI_API_KEY" ]; then
    echo -e "   GEMINI_API_KEY: ${GREEN}${GEMINI_API_KEY:0:10}...${NC}"
fi

if [ -n "$ZHIPU_API_KEY" ]; then
    echo -e "   ZHIPU_API_KEY: ${GREEN}${ZHIPU_API_KEY:0:10}...${NC}"
fi

echo ""
echo -e "${YELLOW}Proceed with configuration? [Y/n]: ${NC}"
read -n 1 -r
echo

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Configuration cancelled${NC}"
    exit 0
fi

# Configure required settings
echo ""
echo -e "${BLUE}🔧 Configuring Azure App Service...${NC}"

SETTINGS="AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY"
SETTINGS="$SETTINGS AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT"
SETTINGS="$SETTINGS AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT"
SETTINGS="$SETTINGS AZURE_OPENAI_API_VERSION=$AZURE_OPENAI_API_VERSION"
SETTINGS="$SETTINGS AZURE_MAX_CONCURRENCY=$AZURE_MAX_CONCURRENCY"
SETTINGS="$SETTINGS NODE_ENV=production"
SETTINGS="$SETTINGS SCM_DO_BUILD_DURING_DEPLOYMENT=true"

# Add optional providers
if [ -n "$OPENAI_API_KEY" ]; then
    SETTINGS="$SETTINGS OPENAI_API_KEY=$OPENAI_API_KEY"
fi

if [ -n "$GEMINI_API_KEY" ]; then
    SETTINGS="$SETTINGS GEMINI_API_KEY=$GEMINI_API_KEY"
fi

if [ -n "$ZHIPU_API_KEY" ]; then
    SETTINGS="$SETTINGS ZHIPU_API_KEY=$ZHIPU_API_KEY"
fi

# Apply settings
az webapp config appsettings set \
    -g "$RESOURCE_GROUP" \
    -n "$APP_NAME" \
    --settings $SETTINGS > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Environment variables configured successfully!${NC}"
    echo ""
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo -e "   1. Run: ${GREEN}./deploy-quick.sh${NC}"
    echo -e "   2. Visit: ${GREEN}https://$APP_NAME.azurewebsites.net${NC}"
    echo ""
else
    echo -e "${RED}❌ Configuration failed. Please check your Azure credentials.${NC}"
    exit 1
fi
