#!/usr/bin/env node
const http = require('http');

const port = process.env.PORT || 3000;
const host = '127.0.0.1';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path, method: 'GET' }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
(async () => {
  try {
    const health = await get('/api/health');
    console.log('[health] status', health.status);
    console.log('[health] body', health.body);
    if (health.status !== 200) process.exit(1);
    const ok = health.body?.services ? Object.values(health.body.services).some(s => s.configured) : false;
    if (!ok) {
      console.warn('No providers configured (this is fine if you are only testing UI)');
    }
  } catch (e) {
    console.error('Health check failed:', e.message);
    process.exit(1);
  }
})();
