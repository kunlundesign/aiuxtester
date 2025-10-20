# Deployment Guide (Azure App Service - Code Mode)

This document explains how to deploy the application to Azure App Service in Code mode (NOT container). The previous failures were caused by running the App Service in a Docker container image setting which bypassed Oryx build and left `node_modules` missing.

## 1. Prerequisites
- Azure Subscription
- Azure CLI >= 2.57
- Node.js 20.x locally (to build & test)
- App Service Plan (Linux) + Web App created (runtime can be anything initially)

## 2. Switch Web App to Code Mode (if currently in Container Mode)
Check current setting:
```
az webapp config show -g <RESOURCE_GROUP> -n <APP_NAME> --query linuxFxVersion -o tsv
```
If it starts with `DOCKER|` you are in container mode and must clear it:
```
# Remove custom container (switches to code mode)
az webapp config set -g <RESOURCE_GROUP> -n <APP_NAME> --linux-fx-version ""
# Set Node runtime (20 LTS)
az webapp config set -g <RESOURCE_GROUP> -n <APP_NAME> --linux-fx-version "NODE|20-lts"
```
Verify again (should output `NODE|20-lts`). In Portal you will now see the Stack/Runtime dropdown.

## 3. Configure App Settings (Environment Variables)
```
az webapp config appsettings set -g <RESOURCE_GROUP> -n <APP_NAME> --settings \
  AZURE_OPENAI_API_KEY=*** \
  AZURE_OPENAI_ENDPOINT=https://<your>.openai.azure.com/ \
  AZURE_OPENAI_DEPLOYMENT=<deployment> \
  AZURE_OPENAI_API_VERSION=2024-02-15-preview \
  AZURE_MAX_CONCURRENCY=3 \
  NODE_ENV=production \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true
```
Optionally add other providers (OPENAI_API_KEY, GEMINI_API_KEY, ZHIPU_API_KEY).

## 4. Create Deployment Zip
Inside project root:
```
npm run build   # optional if you only want to verify; Oryx will build again
npm run package:zip
```
Result: `dist/deploy-YYYYMMDDHHMM.zip` (source only, no node_modules).

## 5. Deploy via ZipDeploy (Option A: Azure CLI)
```
az webapp deploy --resource-group <RESOURCE_GROUP> --name <APP_NAME> \
  --src-path dist/deploy-YYYYMMDDHHMM.zip --type zip
```
(If your CLI version lacks `az webapp deploy`, fallback to `az webapp deployment source config-zip`.)

Option B: Direct HTTP
```
curl -X POST \
  -u $DEPLOY_USER:$DEPLOY_PWD \
  --data-binary @dist/deploy-YYYYMMDDHHMM.zip \
  https://<APP_NAME>.scm.azurewebsites.net/api/zipdeploy
```
Publish credentials can be downloaded from Portal (Get publish profile) — extract userName / userPWD.

## 6. Monitor Deployment
```
# Streaming logs
az webapp log tail -g <RESOURCE_GROUP> -n <APP_NAME>
# Or check deployment log
curl -u $DEPLOY_USER:$DEPLOY_PWD https://<APP_NAME>.scm.azurewebsites.net/api/deployments
```
You should see Oryx steps: Detecting Node, Running npm install, Running npm build.

## 7. Validate After Deployment
Visit:
- https://<APP_NAME>.azurewebsites.net/
- https://<APP_NAME>.azurewebsites.net/api/health

Expected health JSON: `services.azureOpenAI.configured: true` if keys set. Status code 200.

## 8. Common Issues
| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 on root | Build failed or wrong folder structure | Ensure `app/` at root, re-deploy |
| 500 Missing module next | Container mode with no build | Ensure linuxFxVersion is NODE|20-lts |
| Deployment succeeds but blank page | JS build error | Check Log Stream + `/.next` artifacts presence |
| Oryx build not triggered | `SCM_DO_BUILD_DURING_DEPLOYMENT` missing or container mode | Add setting / switch mode |
| 401 calling model | Wrong key or endpoint | Re-copy key, ensure endpoint ends with `.azure.com/` |

## 9. Rollback Strategy
Keep previous working zip in `dist/`. To rollback, redeploy an older zip via the same command.

## 10. Next Steps
- Add CI (GitHub Actions) once manual deploy is stable
- Enable Application Insights for better telemetry
- Consider removing `output: 'standalone'` if not using Docker (optional)

---
Generated on: 2025-10-13
