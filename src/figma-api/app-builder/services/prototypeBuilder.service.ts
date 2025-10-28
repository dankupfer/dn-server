// src/figma-api/app-builder/services/prototypeBuilder.service.ts

/**
 * PROTOTYPE BUILDER SERVICE
 * 
 * Thin wrapper around appBuilder that handles:
 * 1. Directory structure for prototypes
 * 2. Expo web bundling
 * 3. UUID mapping
 * 4. Viewer generation
 * 
 * Delegates actual app building to appBuilder.controller
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as jobQueue from './jobQueue.service';
import { executeBuild } from '../controllers/appBuilder.controller';

const execAsync = promisify(exec);

interface BuildConfig {
  figmaFileId: string;
  figmaFileName: string;
  figmaPageName: string;
  appName: string;
  fullAppConfig: any;
}

interface PrototypeMapping {
  path: string;
  figmaFileId: string;
  figmaPageId?: string;
  createdAt: string;
  views?: number;
  lastViewed?: string;
}

const PROTOTYPES_PATH = path.join(__dirname, '../../../../public/prototypes');
const MAPPINGS_FILE = path.join(PROTOTYPES_PATH, 'mappings.json');

/**
 * Start an async prototype build
 */
export async function startBuild(config: BuildConfig): Promise<string> {
  const jobId = `job-${uuidv4()}`;

  jobQueue.createJob(jobId);

  buildPrototype(jobId, config).catch(error => {
    console.error(`Build failed for job ${jobId}:`, error);
    jobQueue.failJob(jobId, error.message, 'BUILD_FAILED');
  });

  return jobId;
}

/**
 * Main build orchestration
 */
async function buildPrototype(jobId: string, config: BuildConfig): Promise<void> {
  const startTime = Date.now();

  try {
    jobQueue.startJob(jobId);

    // Create paths
    const safeName = (name: string) => name.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const buildPath = path.join(
      PROTOTYPES_PATH,
      safeName(config.figmaFileName),
      safeName(config.figmaPageName),
      safeName(config.appName)
    );
    const tempPath = path.join(buildPath, 'temp');

    // 1. Create directory
    jobQueue.updateProgress(jobId, 10, 'Creating directories...');
    await fs.ensureDir(tempPath);

    // 2. Save fullAppConfig.json
    jobQueue.updateProgress(jobId, 15, 'Saving configuration...');
    await fs.writeJson(path.join(buildPath, 'fullAppConfig.json'), config.fullAppConfig, { spaces: 2 });

    // 3. Use appBuilder to generate the app
    jobQueue.updateProgress(jobId, 20, 'Building app with appBuilder...');
    const buildResult = await executeBuild(
      config.fullAppConfig,
      undefined, // No custom target path
      {
        buildType: 'prototype',
        figmaFileId: config.figmaFileId,
        figmaFileName: config.figmaFileName,
        figmaPageName: config.figmaPageName
      }
    );

    if (!buildResult.success) {
      throw new Error(buildResult.error || 'App build failed');
    }

    // 4. Copy node_modules for bundling
    jobQueue.updateProgress(jobId, 45, 'Preparing for bundling...');
    await copyNodeModules(tempPath);

    // 5. Run expo export:web
    jobQueue.updateProgress(jobId, 50, 'Bundling for web (this may take 30-40s)...');
    await bundleForWeb(tempPath);

    // 6. Copy bundle output
    jobQueue.updateProgress(jobId, 80, 'Copying bundle...');
    await copyBundle(tempPath, buildPath);

    // 7. Generate viewer HTML
    jobQueue.updateProgress(jobId, 85, 'Generating viewer...');
    await generateViewer(buildPath);

    // 8. Generate UUID and update mappings
    jobQueue.updateProgress(jobId, 90, 'Creating shareable link...');
    const uuid = await updateMappings(config, buildPath);

    // 9. Clean up temp
    jobQueue.updateProgress(jobId, 95, 'Cleaning up...');
    await fs.remove(tempPath);

    // Complete!
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    const prototypeUrl = `http://localhost:3001/prototypes/${uuid}`;
    jobQueue.completeJob(jobId, prototypeUrl, buildTime);

  } catch (error: any) {
    console.error('Build error:', error);
    jobQueue.failJob(jobId, error.message, 'BUILD_ERROR');
    throw error;
  }
}

/**
 * Copy node_modules to temp directory
 */
async function copyNodeModules(tempPath: string): Promise<void> {
  const nodeModulesSource = path.join(__dirname, '../template/node_modules');
  const nodeModulesDest = path.join(tempPath, 'node_modules');

  if (await fs.pathExists(nodeModulesSource)) {
    await fs.copy(nodeModulesSource, nodeModulesDest, {
      dereference: true,
      errorOnExist: false,
      filter: (src, dest) => {
        return !dest.startsWith(src);
      }
    });
  } else {
    throw new Error('Template node_modules not found. Run npm install in template directory.');
  }
}

/**
 * Run expo export to bundle the project
 */
async function bundleForWeb(tempPath: string): Promise<void> {
  try {
    const { stdout, stderr } = await execAsync('npx expo export --platform web', {
      cwd: tempPath,
      env: { ...process.env, NODE_ENV: 'production' },
      timeout: 180000
    });

    console.log('Expo export output:', stdout);
    if (stderr) console.error('Expo export errors:', stderr);

  } catch (error: any) {
    console.error('Expo export failed:', error);
    throw new Error(`Bundle generation failed: ${error.message}`);
  }
}

/**
 * Copy bundle output to final location
 */
async function copyBundle(tempPath: string, buildPath: string): Promise<void> {
  const distPath = path.join(tempPath, 'dist');
  const bundlePath = path.join(buildPath, 'bundle');

  if (await fs.pathExists(distPath)) {
    await fs.copy(distPath, bundlePath);
  } else {
    throw new Error('Bundle output not found. Expo export may have failed.');
  }
}

/**
 * Generate viewer HTML with iPhone frame
 */
async function generateViewer(buildPath: string): Promise<void> {
  const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .device-frame {
      width: 375px;
      height: 812px;
      background: #000;
      border-radius: 40px;
      padding: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }
    .device-notch {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 25px;
      background: #000;
      border-radius: 0 0 20px 20px;
      z-index: 10;
    }
    .device-screen {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      overflow: hidden;
      background: #fff;
    }
    .device-screen iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .share-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      gap: 12px;
    }
    .share-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .share-button:hover { background: #5568d3; }
    .share-button:active { transform: scale(0.98); }
    .copied-toast {
      position: fixed;
      top: 100px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s;
    }
    .copied-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="share-controls">
    <button class="share-button" onclick="copyUrl()">📋 Copy Link</button>
    <button class="share-button" onclick="openFullscreen()">🔍 Fullscreen</button>
  </div>
  <div class="copied-toast" id="toast">Link copied to clipboard!</div>
  <div class="device-frame" id="deviceFrame">
    <div class="device-notch"></div>
    <div class="device-screen">
      <iframe src="" id="prototypeFrame"></iframe>
    </div>
  </div>
  <script>
    function copyUrl() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast();
      }).catch(err => console.error('Failed to copy:', err));
    }
    function showToast() {
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
    function openFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen();
  }
}
  // Set iframe src with current UUID from URL
const currentPath = window.location.pathname; // e.g., /prototypes/proto-abc123
document.getElementById('prototypeFrame').src = currentPath + '/bundle/index.html';
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(buildPath, 'index.html'), viewerHtml);
}

/**
 * Update UUID mappings
 */
async function updateMappings(config: BuildConfig, buildPath: string): Promise<string> {
  const uuid = `proto-${uuidv4()}`;
  const relativePath = path.relative(PROTOTYPES_PATH, buildPath);

  const mapping: PrototypeMapping = {
    path: relativePath,
    figmaFileId: config.figmaFileId,
    createdAt: new Date().toISOString(),
    views: 0
  };

  let mappings: Record<string, PrototypeMapping> = {};
  if (await fs.pathExists(MAPPINGS_FILE)) {
    mappings = await fs.readJson(MAPPINGS_FILE);
  }

  mappings[uuid] = mapping;

  await fs.ensureDir(PROTOTYPES_PATH);
  await fs.writeJson(MAPPINGS_FILE, mappings, { spaces: 2 });

  return uuid;
}

/**
 * Get prototype by UUID
 */
export async function getPrototype(uuid: string): Promise<PrototypeMapping | null> {
  if (!await fs.pathExists(MAPPINGS_FILE)) {
    return null;
  }

  const mappings = await fs.readJson(MAPPINGS_FILE);
  return mappings[uuid] || null;
}

/**
 * Increment view count for prototype
 */
export async function incrementViews(uuid: string): Promise<void> {
  if (!await fs.pathExists(MAPPINGS_FILE)) {
    return;
  }

  const mappings = await fs.readJson(MAPPINGS_FILE);
  if (mappings[uuid]) {
    mappings[uuid].views = (mappings[uuid].views || 0) + 1;
    mappings[uuid].lastViewed = new Date().toISOString();
    await fs.writeJson(MAPPINGS_FILE, mappings, { spaces: 2 });
  }
}