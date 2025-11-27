# Migration Complete: Next.js → Vite + Azure Functions

This document summarizes the migration from Next.js App Router to Vite/React + Azure Functions.

## What Changed

### Frontend (Vite + React)

| Before (Next.js) | After (Vite) |
|------------------|--------------|
| `next dev` | `npm run dev` (Vite) |
| `next build` | `npm run build` (Vite) |
| App Router (`src/app/`) | React Router (`src/App.tsx`) |
| `'use client'` directive | Not needed (all client-side) |
| styled-jsx | CSS Modules |
| `@/lib/ai-adapters` (server) | Removed from frontend |

#### New Files
- `vite.config.ts` - Vite configuration with aliases and proxy
- `index.html` - Vite entry HTML
- `src/main.tsx` - React app entry point
- `src/App.tsx` - React Router configuration
- `*.module.css` - CSS Modules for styled-jsx components

#### Modified Files
- `package.json` - Version 2.0.0, Vite deps, new scripts
- `tsconfig.json` - Removed Next.js plugin, added @shared path
- `src/app/page.tsx` - Removed 'use client', styled-jsx, createAIAdapter import
- `src/components/*.tsx` - Converted styled-jsx to CSS Modules

### Backend (Azure Functions v4)

#### New Structure
```
api/
├── host.json              # Azure Functions host config
├── local.settings.json    # Local dev environment variables
├── package.json           # Function app dependencies
├── tsconfig.json          # TypeScript config for Node.js
└── src/
    ├── functions/
    │   ├── evaluate.ts       # POST /api/evaluate
    │   ├── batch-evaluate.ts # POST /api/batch-evaluate
    │   └── health.ts         # GET /api/health
    └── lib/
        ├── ai-adapters.ts    # OpenAI, Gemini, Zhipu adapters
        ├── azure-openai.ts   # Azure OpenAI API client
        └── limit.ts          # Rate limiter
```

### Shared Types

```
shared/
└── types/
    └── index.ts    # Shared types for frontend and backend
```

The frontend `src/types/index.ts` now re-exports from `@shared/types`.

### Azure Static Web Apps

`staticwebapp.config.json` - SPA fallback configuration for Azure deployment.

## How to Run Locally

### 1. Install Dependencies

```bash
# Frontend
cd AI_Scenario_Simulator_3
npm install

# Backend
cd api
npm install
```

### 2. Configure Environment

Edit `api/local.settings.json`:

```json
{
  "Values": {
    "AZURE_OPENAI_API_KEY": "your-key",
    "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
    "AZURE_OPENAI_DEPLOYMENT": "your-deployment",
    "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string"
  }
}
```

### 3. Start Development Servers

**Terminal 1 - Azure Functions:**
```bash
cd api
npm start
# Runs on http://localhost:7071
```

**Terminal 2 - Vite Frontend:**
```bash
npm run dev
# Runs on http://localhost:3000
# API calls proxy to :7071
```

## Key Differences

### API Calls
- Still use relative `/api/*` paths
- Vite dev server proxies to Azure Functions at `:7071`
- Production: Azure Static Web Apps handles routing

### Persona Storage
- **Before:** `fs.readdirSync(public/personas/)`
- **After:** Azure Blob Storage container `personas`

Upload personas to blob storage before running batch evaluations.

### Environment Variables
- **Before:** `.env.local` with `NEXT_PUBLIC_*` prefix
- **After:** `api/local.settings.json` for Functions, Vite `.env` for frontend

### Build Output
- **Frontend:** `dist/` folder (Vite)
- **Backend:** `api/dist/` folder (TypeScript compiled)

## Deployment to Azure Static Web Apps

```bash
# Build frontend
npm run build

# Deploy (Azure SWA CLI or GitHub Actions)
swa deploy ./dist --api-location ./api
```

The `staticwebapp.config.json` handles:
- SPA fallback to `index.html`
- API routing to `/api/*`
- Security headers

## Rollback

To revert to Next.js:
1. Restore original `package.json` and `tsconfig.json`
2. Remove `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
3. Restore styled-jsx in components
4. Add 'use client' directives back
5. Remove `api/`, `shared/`, `staticwebapp.config.json`
6. Run `npm install`
