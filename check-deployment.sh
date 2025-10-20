#!/bin/bash

# 🩺 Check Deployment Status Script
# Run this to check if your deployment is complete

echo "🔍 Checking deployment status..."
echo ""

echo "1️⃣ Checking App Service status..."
az webapp show -g uxtester-platform_group -n uxtester-platform --query "{Name:name,State:state}" -o table

echo ""
echo "2️⃣ Testing health endpoint..."
HTTP_CODE=$(curl -s -o /tmp/health-response.json -w "%{http_code}" https://uxtester-platform.azurewebsites.net/api/health 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed! (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    cat /tmp/health-response.json | python3 -m json.tool 2>/dev/null || cat /tmp/health-response.json
    echo ""
    echo ""
    echo "🎉 Deployment successful!"
    echo "🌐 Visit: https://uxtester-platform.azurewebsites.net"
    echo ""
    echo "📊 View live logs:"
    echo "   az webapp log tail -g uxtester-platform_group -n uxtester-platform"
elif [ "$HTTP_CODE" = "503" ] || [ "$HTTP_CODE" = "000" ]; then
    echo "⏳ Application still starting... (HTTP $HTTP_CODE)"
    echo "   Oryx is building your app (installing npm packages + building Next.js)"
    echo "   This takes 2-4 minutes. Wait a bit and run this script again."
    echo ""
    echo "   Command: ./check-deployment.sh"
    echo ""
    echo "📊 Watch build progress:"
    echo "   az webapp log tail -g uxtester-platform_group -n uxtester-platform"
else
    echo "⚠️ Unexpected status: HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    cat /tmp/health-response.json
    echo ""
    echo ""
    echo "📊 Check logs with:"
    echo "   az webapp log tail -g uxtester-platform_group -n uxtester-platform"
    echo ""
    echo "🔧 Common fixes:"
    echo "   1. Wait 2-3 more minutes (build might still be running)"
    echo "   2. Check if 'next: not found' error - need to redeploy with build"
    echo "   3. Run: az webapp restart -g uxtester-platform_group -n uxtester-platform"
fi

rm -f /tmp/health-response.json
