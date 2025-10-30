// src/figma-api/app-builder/services/bundlers/expoBundler.ts

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as jobQueue from '../jobQueue.service';

const execAsync = promisify(exec);

/**
 * Bundle with Expo (production-optimized, slower)
 */
export async function bundleWithExpo(
    jobId: string,
    tempPath: string,
    buildPath: string
): Promise<void> {
    // Copy node_modules
    jobQueue.updateProgress(jobId, 45, 'Preparing for Expo bundling...');
    await copyNodeModules(tempPath);

    // Run expo export
    jobQueue.updateProgress(jobId, 50, 'Bundling with Expo (30-40s)...');
    await bundleForWebExpo(tempPath);

    // Copy bundle output
    jobQueue.updateProgress(jobId, 80, 'Copying bundle...');
    await copyBundle(tempPath, buildPath);
}

/**
 * Copy node_modules to temp directory
 */
async function copyNodeModules(tempPath: string): Promise<void> {
    const nodeModulesSource = path.join(__dirname, '../../template/node_modules');
    const nodeModulesDest = path.join(tempPath, 'node_modules');

    console.log('   → Checking if node_modules needs copying...');

    if (!await fs.pathExists(nodeModulesDest)) {
        console.log('   → Copying node_modules from template...');
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
    } else {
        console.log('   → node_modules already exists, skipping copy');
    }
}

/**
 * Run expo export to bundle the project
 */
async function bundleForWebExpo(tempPath: string): Promise<void> {
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