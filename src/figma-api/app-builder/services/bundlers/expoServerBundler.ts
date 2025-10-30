// src/figma-api/app-builder/services/bundlers/expoServerBundler.ts

import fs from 'fs-extra';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as jobQueue from '../jobQueue.service';

const EXPO_DEV_PORT = 19006;

// Server state management
let currentServer: {
    process: ChildProcess;
    location: string;
    port: number;
    url: string;
} | null = null;

/**
 * Bundle with Expo Dev Server (fastest for demos)
 */
export async function bundleWithExpoDevServer(
    jobId: string,
    tempPath: string,
    buildPath: string
): Promise<string> {
    console.log('\n📦 EXPO DEV SERVER MODE');
    console.log(`   Current server: ${currentServer ? currentServer.location : 'none'}`);
    console.log(`   New location: ${buildPath}`);

    jobQueue.updateProgress(jobId, 45, 'Preparing for Expo dev server...');

    // Check if we need to restart server
    const needsRestart = !currentServer || currentServer.location !== buildPath;

    console.log(`   Needs restart? ${needsRestart}`);

    if (needsRestart) {
        // FIRST BUILD - Full setup
        if (currentServer) {
            console.log('   → Stopping old server...');
            jobQueue.updateProgress(jobId, 50, 'Stopping old Expo server...');
            await stopExpoServer();
        }

        console.log('   → Copying node_modules...');
        jobQueue.updateProgress(jobId, 55, 'Copying dependencies...');
        await copyNodeModules(tempPath);

        console.log('   → Starting new server...');
        jobQueue.updateProgress(jobId, 60, 'Starting Expo dev server (10-15s)...');
        await startExpoServer(tempPath, buildPath);

        jobQueue.updateProgress(jobId, 80, 'Expo dev server ready!');
    } else {
        // UPDATE - Restart server to clear Metro cache
        console.log('   → Update detected - restarting server to clear cache...');
        jobQueue.updateProgress(jobId, 50, 'Restarting server...');

        await stopExpoServer();

        jobQueue.updateProgress(jobId, 60, 'Starting fresh server (10-15s)...');
        await startExpoServer(tempPath, buildPath);

        jobQueue.updateProgress(jobId, 80, 'Server restarted with fresh cache!');
    }

    console.log(`   ✅ Returning Expo URL: ${currentServer!.url}`);
    return currentServer!.url;
}

/**
 * Start Expo dev server
 */
async function startExpoServer(tempPath: string, buildPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Starting Expo dev server at ${tempPath}`);

        const expoProcess = spawn('npx', [
            'expo',
            'start',
            '--web',
            '--port', EXPO_DEV_PORT.toString()
        ], {
            cwd: tempPath,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                CI: '1',
                EXPO_NO_OPEN: '1',
                BROWSER: 'none'
            }
        });

        let serverReady = false;

        expoProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log('Expo:', output);

            if (!serverReady && (output.includes('Metro waiting') || output.includes('Logs for your project'))) {
                serverReady = true;
                currentServer = {
                    process: expoProcess,
                    location: buildPath,
                    port: EXPO_DEV_PORT,
                    url: `http://localhost:${EXPO_DEV_PORT}`
                };
                console.log(`✅ Expo server ready at ${currentServer.url}`);
                resolve();
            }
        });

        expoProcess.stderr?.on('data', (data) => {
            console.error('Expo error:', data.toString());
        });

        expoProcess.on('error', (error) => {
            console.error('Failed to start Expo:', error);
            reject(error);
        });

        expoProcess.on('exit', (code) => {
            console.log(`Expo server exited with code ${code}`);
            if (currentServer?.process === expoProcess) {
                currentServer = null;
            }
        });

        setTimeout(() => {
            if (!serverReady) {
                expoProcess.kill();
                reject(new Error('Expo server failed to start within 30 seconds'));
            }
        }, 30000);
    });
}

/**
 * Stop Expo dev server
 */
export async function stopExpoServer(): Promise<void> {
    if (!currentServer) {
        return;
    }

    console.log('🛑 Stopping Expo dev server...');

    return new Promise((resolve) => {
        const server = currentServer!;
        currentServer = null;

        server.process.on('exit', () => {
            console.log('✅ Expo server stopped');
            resolve();
        });

        server.process.kill('SIGTERM');

        setTimeout(() => {
            if (!server.process.killed) {
                server.process.kill('SIGKILL');
            }
            resolve();
        }, 5000);
    });
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
                errorOnExist: false
            });

            // Install worklets packages to fix nested dependency issues
            console.log('   → Installing worklets packages...');
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            await execAsync(
                'npm install react-native-worklets@^0.1.0 react-native-worklets-core@^1.3.3 --legacy-peer-deps',
                { cwd: tempPath }
            );
            console.log('   ✅ Worklets packages installed');

        } else {
            throw new Error('Template node_modules not found. Run npm install in template directory.');
        }
    } else {
        console.log('   → node_modules already exists, skipping copy');
    }
}