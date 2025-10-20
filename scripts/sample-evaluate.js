#!/usr/bin/env node
/**
 * Simple local test script to call /api/evaluate with mock mode.
 * Ensure you have: MOCK_MODE=1 in .env.local and dev server running (npm run dev).
 */
const http = require('http');

const payload = {
  model: 'openai',
  personaId: 'persona-1', // adjust to existing persona id in data/personas.ts
  images: [
    // minimal 1px transparent PNG
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PW6iVwAAAABJRU5ErkJggg=='
  ],
  designBackground: 'Test background for mock evaluation.'
};

function post(path) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      host: '127.0.0.1',
      port: process.env.PORT || 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { body = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const r = await post('/api/evaluate');
    console.log('Status:', r.status);
    console.dir(r.body, { depth: 5, colors: true });
  } catch (e) {
    console.error('Error calling evaluate:', e);
    process.exit(1);
  }
})();
