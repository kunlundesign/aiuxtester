# 🚀 Quick Deployment Guide (No Docker Required!)

This guide helps you deploy to Azure Web App in **under 5 minutes** without Docker.

## Why This Method?

✅ **Lightweight** - No Docker installation needed  
✅ **Fast** - Deploy in 2-3 minutes  
✅ **Simple** - One command deployment  
✅ **Azure-Native** - Uses Oryx build system (same as GitHub Actions)  
✅ **Easy Updates** - Just run the script again to update

## Prerequisites (One-Time Setup)

1. **Azure CLI** - [Install here](https://aka.ms/InstallAzureCLIDirect)
2. **Node.js 20** - Already installed ✅
3. **Azure Account** - Already logged in ✅

### First-Time Setup (5 minutes)

#### 1. Login to Azure (if not already)
```bash
az login
```

#### 2. Verify Your App Service Settings
```bash
# Check your app name and resource group
az webapp show -g uxtester-platform_group -n uxtester-platform --query "{name:name,state:state,url:defaultHostName}" -o table
```

#### 3. Set Environment Variables (IMPORTANT!)
```bash
az webapp config appsettings set \
  -g uxtester-platform_group \
  -n uxtester-platform \
  --settings \
    AZURE_OPENAI_API_KEY='your_actual_key_here' \
    AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/' \
    AZURE_OPENAI_DEPLOYMENT='your-deployment-name' \
    AZURE_OPENAI_API_VERSION='2024-02-15-preview' \
    AZURE_MAX_CONCURRENCY='3' \
    NODE_ENV='production' \
    SCM_DO_BUILD_DURING_DEPLOYMENT='true'
```

**💡 Tip:** Get your keys from `.env.local` or Azure Portal

---

## 🎯 Deploy Now (Every Time You Update)

### Method 1: Using the Quick Script (Recommended)

```bash
./deploy-quick.sh
```

That's it! The script will:
1. ✅ Check prerequisites
2. ✅ Configure App Service for Code mode
3. ✅ Verify environment variables
4. ✅ Build your application
5. ✅ Create deployment package
6. ✅ Deploy to Azure (Oryx builds on server)
7. ✅ Run health checks

**Expected time:** 2-5 minutes

---

### Method 2: Manual Deployment (If Script Fails)

```bash
# 1. Build locally
npm run build

# 2. Create deployment package
npm run package:zip

# 3. Deploy the latest zip
az webapp deploy \
  --resource-group uxtester-platform_group \
  --name uxtester-platform \
  --src-path $(ls -t dist/deploy-*.zip | head -1) \
  --type zip
```

---

## 🩺 Verify Deployment

### Check Application
Visit: https://uxtester-platform.azurewebsites.net

### Check Health Endpoint
```bash
curl https://uxtester-platform.azurewebsites.net/api/health | python3 -m json.tool
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.4.0",
  "environment": "production",
  "services": {
    "azure_openai": {
      "configured": true,
      "endpoint": "configured"
    }
  }
}
```

### View Live Logs
```bash
az webapp log tail -g uxtester-platform_group -n uxtester-platform
```

---

## 🔧 Troubleshooting

### Issue: "Module not found: next"
**Cause:** App Service in Container mode  
**Fix:**
```bash
az webapp config set -g uxtester-platform_group -n uxtester-platform --linux-fx-version "NODE|20-lts"
./deploy-quick.sh
```

### Issue: "Health check fails (500)"
**Cause:** Missing environment variables  
**Fix:** Re-run the environment variable setup (Step 3 in First-Time Setup)

### Issue: "Build failed on Azure"
**Cause:** Oryx build disabled or wrong Node version  
**Fix:**
```bash
# Enable Oryx build
az webapp config appsettings set \
  -g uxtester-platform_group \
  -n uxtester-platform \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Redeploy
./deploy-quick.sh
```

### Issue: "Deployment too slow"
**Solution:** The first deployment takes 3-5 minutes. Subsequent deployments are faster (2-3 minutes) because dependencies are cached.

---

## 📊 Comparison: Docker vs Quick Deploy

| Feature | Docker (deploy.sh) | Quick Deploy (deploy-quick.sh) |
|---------|-------------------|-------------------------------|
| **Setup Time** | 15-30 min | 5 min |
| **Requires Docker** | ✅ Yes | ❌ No |
| **Deploy Time** | 5-8 min | 2-5 min |
| **Build Location** | Local + Azure | Azure only (Oryx) |
| **Disk Space** | ~2GB (images) | ~500MB (zip) |
| **Complexity** | Medium | Simple |
| **Recommended For** | Production, multi-env | Quick updates, solo dev |

---

## 🎨 Customization

### Change Resource Group or App Name
Edit the script or set environment variables:

```bash
export AZURE_RESOURCE_GROUP="your-resource-group"
export AZURE_APP_NAME="your-app-name"
./deploy-quick.sh
```

### Deploy Without Building Locally
Remove the build step from `deploy-quick.sh` (Oryx will build on Azure):
- Comment out lines 110-114 (the npm run build section)
- Deployment will take slightly longer but requires less local processing

---

## 🚀 Quick Reference

### Deploy (Update Code)
```bash
./deploy-quick.sh
```

### Check Status
```bash
curl https://uxtester-platform.azurewebsites.net/api/health
```

### View Logs
```bash
az webapp log tail -g uxtester-platform_group -n uxtester-platform
```

### Restart App
```bash
az webapp restart -g uxtester-platform_group -n uxtester-platform
```

### Rollback (if needed)
```bash
# Deploy an older zip from dist/
az webapp deploy \
  --resource-group uxtester-platform_group \
  --name uxtester-platform \
  --src-path dist/deploy-OLDERTIMESTAMP.zip \
  --type zip
```

---

## 🎯 Next Steps

### For Automated Deployments (Optional)
Once your manual deployment works, consider setting up GitHub Actions:
1. Add secrets to your GitHub repo
2. Push to `main` branch
3. Automatic deployment! ✨

See `.github/workflows/azure-deploy.yml` for the workflow.

---

## 📝 Notes

- **No Docker required** - This method uses Azure's Oryx build system
- **Source code only** - The zip contains source code, not `node_modules` or `.next`
- **Azure builds** - Oryx runs `npm install` and `npm run build` on Azure
- **Safe for secrets** - `.env.local` is NOT included in the zip
- **Quick updates** - Perfect for rapid iteration and hot fixes

---

## ❓ FAQ

**Q: Do I need to build locally?**  
A: The script builds locally for verification, but you can skip it. Oryx will build on Azure anyway.

**Q: What's included in the deployment package?**  
A: Source code (`src/`, `public/`, config files). NO `node_modules`, `.next`, or `.env.local`.

**Q: Can I use this with other Azure subscriptions?**  
A: Yes! Just change `AZURE_RESOURCE_GROUP` and `AZURE_APP_NAME` at the top of the script.

**Q: How do I rollback?**  
A: Keep old zip files in `dist/` and redeploy them using `az webapp deploy`.

**Q: Is this production-ready?**  
A: Yes! This is the same method used by Azure's own CI/CD pipelines. For multi-environment setups, Docker might be better.

---

**Created:** 2025-10-14  
**Last Updated:** 2025-10-14  
**Version:** 1.0
