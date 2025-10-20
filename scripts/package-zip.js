#!/usr/bin/env node
/**
 * Create a clean source zip for Azure ZipDeploy (Code mode / Oryx build).
 * - Excludes node_modules, .next, previous zips
 * - Includes package.json, package-lock.json (if any), next.config.js, tsconfig.json, app, lib, components, data, public, types
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const zipName = `deploy-${stamp}.zip`;
const target = path.join(outDir, zipName);

// Determine available files
const entries = [
  'package.json',
  'package-lock.json', // may not exist
  'next.config.js',
  'tsconfig.json',
  'next-env.d.ts',
  '.env.example',
  'app',
  'src/app', // fallback if still exists
  'components',
  'lib',
  'data',
  'public',
  'types'
].filter(f => fs.existsSync(path.join(root, f)));

const zipCmd = `zip -r -q ${target} ${entries.join(' ')} -x "**/node_modules/**" "**/.next/**" "dist/**" "deploy-*.zip"`;
console.log('Creating zip:', target);
console.log('Including entries:', entries.join(', '));
execSync(zipCmd, { stdio: 'inherit' });
console.log('\nDone. Upload this file with ZipDeploy:');
console.log(target);
