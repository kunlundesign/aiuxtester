# 🎯 Your First Deployment - Walkthrough

**Date:** October 14, 2025  
**Status:** Ready to Deploy! ✅

---

## ✅ Current Status Check

### Azure CLI Login
- ✅ **Logged In:** kunlundesign@gmail.com
- ✅ **Subscription:** Visual Studio Enterprise Subscription

### Azure Web App
- ✅ **Name:** uxtester-platform
- ✅ **Resource Group:** uxtester-platform_group
- ✅ **Status:** Running
- ✅ **URL:** https://uxtester-platform.azurewebsites.net
- ✅ **Runtime:** NODE|20-lts (Code mode - Perfect!)

### What's Missing
- ⚠️ **Environment Variables:** Not configured yet (we'll do this next!)

---

## 📋 Deployment Steps

### Step 1: Configure Environment Variables ⚠️ (Required)

Your Azure Web App needs API keys to function. We have two options:

#### **Option A: Use Setup Script (Easiest)**
```bash
./setup-env.sh
```

This script will:
1. Read your `.env.local` file (if it exists)
2. Ask for any missing values
3. Configure everything automatically

#### **Option B: Manual Configuration**
```bash
az webapp config appsettings set \
  -g uxtester-platform_group \
  -n uxtester-platform \
  --settings \
    AZURE_OPENAI_API_KEY='your_key_here' \
    AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/' \
    AZURE_OPENAI_DEPLOYMENT='your_deployment_name' \
    AZURE_OPENAI_API_VERSION='2024-02-15-preview' \
    AZURE_MAX_CONCURRENCY='3' \
    NODE_ENV='production' \
    SCM_DO_BUILD_DURING_DEPLOYMENT='true'
```

**💡 Where to get these values:**
- Check your `.env.local` file in this project
- Or get them from Azure Portal → Your OpenAI resource

---

### Step 2: Deploy Your Application 🚀

Once environment variables are configured, deploy with one command:

```bash
./deploy-quick.sh
```

**What will happen:**
1. ✅ Script checks prerequisites (already done!)
2. ✅ Verifies App Service configuration (already correct!)
3. ✅ Checks environment variables (will confirm)
4. ✅ Installs dependencies (if needed)
5. ✅ Builds your application locally
6. ✅ Creates deployment package (zip file)
7. ✅ Uploads to Azure
8. ✅ Azure rebuilds on server (Oryx)
9. ✅ Runs health checks
10. ✅ Shows you the results!

**Expected time:** 2-5 minutes

---

### Step 3: Verify Deployment ✨

After deployment completes:

#### Check the website:
```bash
# Open in browser
open https://uxtester-platform.azurewebsites.net
```

#### Check health endpoint:
```bash
curl https://uxtester-platform.azurewebsites.net/api/health | python3 -m json.tool
```

**Expected output:**
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

#### Watch live logs (optional):
```bash
az webapp log tail -g uxtester-platform_group -n uxtester-platform
```

Press `Ctrl+C` to exit log viewer.

---

## 🎬 Ready to Start?

### Let's begin with environment setup:

**Check if you have .env.local:**
```bash
cat .env.local
```

**If the file exists and has your keys:**
```bash
./setup-env.sh
```

**If you need to enter them manually:**
The script will prompt you, or use the manual command in Step 1 Option B above.

---

## 🆘 Troubleshooting

### If setup-env.sh asks for values:
You'll need:
1. `AZURE_OPENAI_API_KEY` - Your Azure OpenAI key
2. `AZURE_OPENAI_ENDPOINT` - Like: https://yourname.openai.azure.com/
3. `AZURE_OPENAI_DEPLOYMENT` - Your model deployment name

Get these from: **Azure Portal → Azure OpenAI Service → Keys and Endpoint**

### If you see "403" or "401" errors:
- Double-check your API key is correct
- Make sure endpoint ends with `/`
- Verify deployment name matches exactly

### If build fails:
```bash
# Clean and rebuild locally first
rm -rf .next node_modules
npm install
npm run build

# Then try deployment again
./deploy-quick.sh
```

---

## 📝 After First Deployment

### For future updates (super easy!):
```bash
# Make your code changes
# Then just run:
./deploy-quick.sh
```

That's it! No need to set environment variables again.

### To update environment variables later:
```bash
./setup-env.sh
```

Or directly with Azure CLI:
```bash
az webapp config appsettings set \
  -g uxtester-platform_group \
  -n uxtester-platform \
  --settings KEY_NAME='new_value'
```

---

## 🎉 Quick Commands Reference

| Action | Command |
|--------|---------|
| **Deploy** | `./deploy-quick.sh` |
| **Setup Env** | `./setup-env.sh` |
| **View Site** | `open https://uxtester-platform.azurewebsites.net` |
| **Check Health** | `curl https://uxtester-platform.azurewebsites.net/api/health` |
| **View Logs** | `az webapp log tail -g uxtester-platform_group -n uxtester-platform` |
| **Restart App** | `az webapp restart -g uxtester-platform_group -n uxtester-platform` |

---

**Next:** Let's configure your environment variables and deploy! 🚀
