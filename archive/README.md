# Legacy Deployment Files Archive

This folder contains previous deployment attempts and experimental configurations that are no longer needed for the main deployment workflow.

## Archived on: 2025-10-14

## Contents:
- `deploy-final/` - Previous deployment configuration
- `deploy-fixed/` - Attempted fixes for deployment issues
- `deploy-light/` - Lightweight deployment experiment
- `deploy-mini/` - Minimal deployment configuration
- `fix-package/` - Package.json fix attempt

## Why Archived?
These folders contained duplicate or experimental code that made the project structure confusing. They have been preserved here for reference but are not needed for current deployments.

## Current Deployment
Use the simplified deployment method in the project root:
- **Quick Deploy:** `./deploy-quick.sh` (Recommended - No Docker)
- **Docker Deploy:** `./deploy.sh` (Container-based)
- **Documentation:** `QUICK_DEPLOY.md`

## Restoration
If you need to restore any of these configurations, simply copy them back to the project root. However, the current deployment method is more streamlined and easier to maintain.

---
**Note:** These files are kept for historical reference only. The current deployment strategy is documented in the main project directory.
