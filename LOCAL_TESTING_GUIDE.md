# Local Testing Guide

This guide helps you run and test the app locally with or without real AI provider keys.

## 1. Install & Run
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Visit http://localhost:3000
```

## 2. Environment Variables
Copy `.env.example` to `.env.local` and fill at least one provider OR enable mock mode.

Minimal (Azure preferred):
```dotenv
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deploy
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```
Or mock mode:
```dotenv
MOCK_MODE=1
```
When `MOCK_MODE=1`, external API calls are skipped and deterministic sample data is returned.

## 3. Health Check
```bash
npm run health:check
```
Expect status 200; if no providers configured you will see a warning.

## 4. Sample Evaluation (Mock Mode)
1. Ensure `MOCK_MODE=1` in `.env.local`
2. Start dev server
3. Run:
```bash
npm run sample:evaluate
```
Expected output includes `model: "openai"` (mock) and generated scores/highlights/issues.

## 5. Using Real Providers
- Remove or set `MOCK_MODE=0`
- Provide the relevant keys (Azure or OpenAI etc.)
- Restart dev server so Next.js picks up changes

## 6. Debug Tips
| Symptom | Possible Cause | Fix |
|--------|----------------|-----|
| 500 on /api/evaluate | Invalid request schema | Check payload fields in `scripts/sample-evaluate.js` vs `evaluate/route.ts` |
| Scores look identical every run | Mock mode deterministic | Disable MOCK_MODE or add real keys |
| Health shows provider missing | Env var name mismatch | Compare with `.env.example` |
| ENOENT image decode errors | Invalid base64 prefix | Ensure `data:image/png;base64,` prefix included |

## 7. Production Build Test
```bash
npm run build
npm start
# Visit http://localhost:3000
```

## 8. Updating Mock Logic
The mock adapter lives in `src/lib/ai-adapters.ts` (class `MockAdapter`). Adjust scoring or messages there.

## 9. Next Steps
After confirming local behavior, proceed with Azure deployment steps in `DEPLOYMENT.md` (skip if not deploying yet).

