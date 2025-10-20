#!/bin/bash

# 🚀 Quick Azure App Service Deployment (Code Mode - No Docker)
# This script deploys your Next.js app to Azure Web App using ZipDeploy
# Oryx will handle the build on Azure, so you don't need Docker locally!

set -e

# 📋 Configuration
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-uxtester-platform_group}"
APP_NAME="${AZURE_APP_NAME:-uxtester-platform}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Quick Azure Deployment (No Docker)     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not installed. Please install: https://aka.ms/InstallAzureCLIDirect${NC}"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged into Azure. Please run: az login${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Display configuration
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "   Resource Group: ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "   App Name: ${GREEN}$APP_NAME${NC}"
echo -e "   Node Version: ${GREEN}$(node --version)${NC}"
echo ""

# Confirm deployment
read -p "$(echo -e ${YELLOW}Continue with deployment? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Step 1: Ensure App Service is in Code mode (not Container)
echo ""
echo -e "${BLUE}🔧 Step 1/6: Configuring App Service for Code deployment...${NC}"
CURRENT_FX=$(az webapp config show -g "$RESOURCE_GROUP" -n "$APP_NAME" --query linuxFxVersion -o tsv 2>/dev/null || echo "")

if [[ $CURRENT_FX == DOCKER* ]]; then
    echo -e "${YELLOW}⚠️  Currently in Container mode, switching to Code mode...${NC}"
    az webapp config set -g "$RESOURCE_GROUP" -n "$APP_NAME" --linux-fx-version "NODE|20-lts" > /dev/null
    echo -e "${GREEN}✅ Switched to Node 20 LTS${NC}"
elif [[ $CURRENT_FX == NODE* ]]; then
    echo -e "${GREEN}✅ Already in Code mode: $CURRENT_FX${NC}"
else
    echo -e "${YELLOW}⚠️  Setting runtime to Node 20 LTS...${NC}"
    az webapp config set -g "$RESOURCE_GROUP" -n "$APP_NAME" --linux-fx-version "NODE|20-lts" > /dev/null
    echo -e "${GREEN}✅ Runtime configured${NC}"
fi

# Step 2: Verify environment variables
echo ""
echo -e "${BLUE}🔧 Step 2/6: Checking environment variables...${NC}"
AZURE_KEY=$(az webapp config appsettings list -g "$RESOURCE_GROUP" -n "$APP_NAME" --query "[?name=='AZURE_OPENAI_API_KEY'].value | [0]" -o tsv 2>/dev/null || echo "")
NODE_ENV=$(az webapp config appsettings list -g "$RESOURCE_GROUP" -n "$APP_NAME" --query "[?name=='NODE_ENV'].value | [0]" -o tsv 2>/dev/null || echo "")

if [[ -z "$AZURE_KEY" ]]; then
    echo -e "${YELLOW}⚠️  AZURE_OPENAI_API_KEY not set. Set it now? [y/N]: ${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Please set environment variables manually:${NC}"
        echo "   az webapp config appsettings set -g $RESOURCE_GROUP -n $APP_NAME --settings \\"
        echo "     AZURE_OPENAI_API_KEY='your_key' \\"
        echo "     AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/' \\"
        echo "     AZURE_OPENAI_DEPLOYMENT='your-deployment' \\"
        echo "     AZURE_OPENAI_API_VERSION='2024-02-15-preview' \\"
        echo "     NODE_ENV='production' \\"
        echo "     SCM_DO_BUILD_DURING_DEPLOYMENT='true'"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Environment variables configured${NC}"
fi

# Ensure build setting is enabled
echo -e "${YELLOW}📝 Ensuring Oryx build is enabled...${NC}"
az webapp config appsettings set -g "$RESOURCE_GROUP" -n "$APP_NAME" \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true NODE_ENV=production > /dev/null 2>&1
echo -e "${GREEN}✅ Build settings configured${NC}"

# Step 3: Install dependencies locally (optional, for verification)
echo ""
echo -e "${BLUE}🔧 Step 3/6: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Running npm ci...${NC}"
    npm ci
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 4: Build locally (optional, for verification)
echo ""
echo -e "${BLUE}🔧 Step 4/6: Building application...${NC}"
echo -e "${YELLOW}⏳ Running npm run build (this may take a minute)...${NC}"
npm run build
echo -e "${GREEN}✅ Build successful${NC}"

# Step 5: Create deployment package
echo ""
echo -e "${BLUE}📦 Step 5/6: Creating deployment package...${NC}"

# Use the existing package-zip script or create inline
if [ -f "scripts/package-zip.js" ]; then
    npm run package:zip
    LATEST_ZIP=$(ls -t dist/deploy-*.zip 2>/dev/null | head -1)
else
    # Fallback: create zip manually
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    LATEST_ZIP="dist/deploy-${TIMESTAMP}.zip"
    mkdir -p dist
    
    # Create a clean zip with source code (Oryx will build on Azure)
    zip -r "$LATEST_ZIP" \
        src/ \
        public/ \
        package.json \
        package-lock.json \
        next.config.js \
        tsconfig.json \
        next-env.d.ts \
        .env.example \
        -x "*.DS_Store" "node_modules/*" ".next/*" "dist/*" > /dev/null
fi

if [ ! -f "$LATEST_ZIP" ]; then
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

ZIP_SIZE=$(du -h "$LATEST_ZIP" | cut -f1)
echo -e "${GREEN}✅ Package created: $LATEST_ZIP ($ZIP_SIZE)${NC}"

# Step 6: Deploy to Azure
echo ""
echo -e "${BLUE}🚀 Step 6/6: Deploying to Azure...${NC}"
echo -e "${YELLOW}⏳ This will take 2-5 minutes (Oryx will build on Azure)...${NC}"

# Use config-zip method (more reliable for triggering Oryx builds)
# Note: az webapp deploy sometimes doesn't trigger builds properly
az webapp deployment source config-zip \
    -g "$RESOURCE_GROUP" \
    -n "$APP_NAME" \
    --src "$LATEST_ZIP"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check logs above.${NC}"
    exit 1
fi

# Wait for app to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for app to start (30 seconds)...${NC}"
sleep 30

# Health check
echo ""
echo -e "${BLUE}🩺 Running health check...${NC}"
HEALTH_URL="https://${APP_NAME}.azurewebsites.net/api/health"

for i in {1..5}; do
    echo -e "${YELLOW}Attempt $i/5: Checking $HEALTH_URL${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo ""
        curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"
        break
    elif [ "$i" -eq 5 ]; then
        echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
        echo -e "${YELLOW}Check logs: az webapp log tail -g $RESOURCE_GROUP -n $APP_NAME${NC}"
    else
        echo -e "${YELLOW}Not ready yet (HTTP $HTTP_CODE), waiting 10 seconds...${NC}"
        sleep 10
    fi
done

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      🎉 Deployment Complete! 🎉          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Application URL:${NC}"
echo -e "   https://${APP_NAME}.azurewebsites.net"
echo ""
echo -e "${BLUE}🩺 Health Check:${NC}"
echo -e "   https://${APP_NAME}.azurewebsites.net/api/health"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo -e "   az webapp log tail -g $RESOURCE_GROUP -n $APP_NAME"
echo ""
echo -e "${BLUE}🔄 Redeploy:${NC}"
echo -e "   ./deploy-quick.sh"
echo ""
echo -e "${GREEN}✨ Done!${NC}"
