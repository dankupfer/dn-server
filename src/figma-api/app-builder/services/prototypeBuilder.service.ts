// src/figma-api/app-builder/services/prototypeBuilder.service.ts

/**
 * PROTOTYPE BUILDER SERVICE
 * 
 * Main orchestrator that handles:
 * 1. Directory structure for prototypes
 * 2. Delegates bundling to specialized bundlers
 * 3. UUID mapping and viewer generation
 * 4. Build coordination
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as jobQueue from './jobQueue.service';
import { executeBuild } from '../controllers/appBuilder.controller';

// Import bundlers
import { bundleWithEsbuild } from './bundlers/esbuildBundler';
import { bundleWithExpo } from './bundlers/expoBundler';
import { bundleWithExpoDevServer, stopExpoServer } from './bundlers/expoServerBundler';

// Import utilities
import { generateViewer } from './utils/viewerGenerator';
import { updateMappings, getPrototype, incrementViews } from './utils/mappingsManager';

// Re-export utilities for external use
export { getPrototype, incrementViews };

type BundleType = 'esbuild' | 'expo' | 'expo_server';

interface BuildConfig {
  figmaFileId: string;
  figmaFileName: string;
  figmaPageName: string;
  appName: string;
  fullAppConfig: any;
  bundleType?: BundleType;
}

const PROTOTYPES_PATH = path.join(__dirname, '../../../../public/prototypes');

// Get default bundle type from env
const DEFAULT_BUNDLE_TYPE: BundleType =
  (process.env.BUNDLE_TYPE as BundleType) || 'esbuild';

/**
 * Start an async prototype build
 */
export async function startBuild(config: BuildConfig): Promise<string> {
  const jobId = `job-${uuidv4()}`;
  const bundleType = config.bundleType || DEFAULT_BUNDLE_TYPE;

  console.log(`📦 Using bundle type: ${bundleType}`);

  jobQueue.createJob(jobId);

  buildPrototype(jobId, { ...config, bundleType }).catch(error => {
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

    const bundleType = config.bundleType || DEFAULT_BUNDLE_TYPE;

    console.log('═══════════════════════════════════════');
    console.log('🔧 BUILD CONFIGURATION:');
    console.log(`   Bundle Type: ${bundleType}`);
    console.log(`   App Name: ${config.appName}`);
    console.log(`   From ENV: ${process.env.BUNDLE_TYPE}`);
    console.log('═══════════════════════════════════════');

    // Create paths
    const safeName = (name: string) => name.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const buildPath = path.join(
      PROTOTYPES_PATH,
      safeName(config.figmaFileName),
      safeName(config.figmaPageName),
      safeName(config.appName)
    );
    const tempPath = path.join(buildPath, 'temp');

    console.log(`📁 Build Path: ${buildPath}`);
    console.log(`📁 Temp Path: ${tempPath}`);

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
      tempPath,
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

    // 4. Bundle based on type
    let prototypeUrl: string;

    console.log(`\n🎯 Bundling with: ${bundleType}`);

    if (bundleType === 'expo_server') {
      console.log('→ Using Expo Dev Server mode');
      const expoServerUrl = await bundleWithExpoDevServer(jobId, tempPath, buildPath);

      // Generate viewer
      jobQueue.updateProgress(jobId, 85, 'Generating viewer...');
      await generateViewer(buildPath, bundleType, expoServerUrl);

      // Generate UUID
      jobQueue.updateProgress(jobId, 90, 'Creating shareable link...');
      const uuid = await updateMappings(config, buildPath, bundleType);
      prototypeUrl = `http://localhost:3001/prototypes/${uuid}`;

      console.log(`✅ Expo server URL (direct): ${expoServerUrl}`);
      console.log(`✅ Viewer URL (with frame): ${prototypeUrl}`);
    } else if (bundleType === 'expo') {
      console.log('→ Using Expo Export mode');
      await bundleWithExpo(jobId, tempPath, buildPath);
      jobQueue.updateProgress(jobId, 85, 'Generating viewer...');
      await generateViewer(buildPath, bundleType);
      jobQueue.updateProgress(jobId, 90, 'Creating shareable link...');
      const uuid = await updateMappings(config, buildPath, bundleType);
      prototypeUrl = `http://localhost:3001/prototypes/${uuid}`;
      console.log(`✅ Expo export URL: ${prototypeUrl}`);
    } else {
      console.log('→ Using esbuild mode');
      await bundleWithEsbuild(jobId, tempPath, buildPath);
      jobQueue.updateProgress(jobId, 85, 'Generating viewer...');
      await generateViewer(buildPath, bundleType);
      jobQueue.updateProgress(jobId, 90, 'Creating shareable link...');
      const uuid = await updateMappings(config, buildPath, bundleType);
      prototypeUrl = `http://localhost:3001/prototypes/${uuid}`;
      console.log(`✅ esbuild URL: ${prototypeUrl}`);
    }

    // 5. Clean up temp (skip for expo_server as it needs the files)
    if (bundleType !== 'expo_server') {
      jobQueue.updateProgress(jobId, 95, 'Cleaning up...');
      await fs.remove(tempPath);
    }

    console.log('\n🎉 BUILD COMPLETE');
    console.log(`   Final URL: ${prototypeUrl}`);
    console.log('═══════════════════════════════════════\n');

    // Complete!
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    jobQueue.completeJob(jobId, prototypeUrl, buildTime);

  } catch (error: any) {
    console.error('Build error:', error);
    jobQueue.failJob(jobId, error.message, 'BUILD_ERROR');
    throw error;
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await stopExpoServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await stopExpoServer();
  process.exit(0);
});