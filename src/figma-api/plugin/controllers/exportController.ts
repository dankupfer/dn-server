// src/figma-api/plugin/controllers/exportController.ts

import { Request, Response } from 'express';
import { buildApp } from '../../app-builder/controllers/appBuilder.controller';
import * as prototypeBuilder from '../../app-builder/services/prototypeBuilder.service';
import { buildAppForExport } from '../../app-builder/controllers/appBuilder.controller';

/**
 * POST /api/figma/plugin/export/full-app
 * Export full app configuration
 * Handles three export types: web, simulator, zip
 */
export async function exportFullApp(req: Request, res: Response) {
    try {
        const {
            appName,
            exportPath,
            exportType,
            appFrame,
            components,
            figmaFileInfo,
            bundleType  // NEW: Optional bundleType parameter
        } = req.body;

        // Validate required fields
        if (!appName || !appFrame || !components) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: appName, appFrame, components'
            });
        }

        // Validate exportType
        if (!exportType || !['web', 'simulator', 'zip'].includes(exportType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exportType. Must be: web, simulator, or zip'
            });
        }

        // For simulator export, exportPath is required
        if (exportType === 'simulator' && !exportPath) {
            return res.status(400).json({
                success: false,
                error: 'Export path is required for simulator export'
            });
        }

        // For web export, figmaFileInfo is required
        if (exportType === 'web' && !figmaFileInfo) {
            return res.status(400).json({
                success: false,
                error: 'Figma file info is required for web export'
            });
        }

        console.log(`📤 Received ${exportType} export request for app:`, appName);
        console.log(`📦 Bundle type: ${bundleType || 'default from env'}`);
        if (figmaFileInfo) {
            console.log('📄 Figma file:', figmaFileInfo.fileName, '/', figmaFileInfo.pageName);
        }

        // Handle based on export type
        if (exportType === 'web') {
            // Start prototype build (async)
            const jobId = await prototypeBuilder.startBuild({
                figmaFileId: figmaFileInfo.fileKey,
                figmaFileName: figmaFileInfo.fileName,
                figmaPageName: figmaFileInfo.pageName,
                appName: appName,
                fullAppConfig: {
                    appName,
                    version: '1.0.0',
                    exportedAt: new Date().toISOString(),
                    appFrame,
                    components
                },
                bundleType: bundleType as 'esbuild' | 'expo' | undefined  // NEW: Pass bundleType
            });

            return res.json({
                success: true,
                message: 'Web prototype build started',
                jobId: jobId,
                exportType: 'web',
                bundleType: bundleType || process.env.BUNDLE_TYPE || 'esbuild',
                estimatedTime: bundleType === 'expo' ? 60 : 15  // Different estimates
            });

        } else if (exportType === 'simulator') {
            // Build app for simulator (sync)
            const result = await buildAppForExport({
                appName,
                exportPath,
                appFrame,
                components
            });

            if (result.success) {
                return res.json({
                    success: true,
                    message: 'Simulator export completed successfully',
                    filePath: result.appPath,
                    screenCount: components.length,
                    exportType: 'simulator'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Build failed'
                });
            }

        } else if (exportType === 'zip') {
            // TODO: Implement zip download
            return res.status(501).json({
                success: false,
                error: 'Zip download not yet implemented'
            });
        }

    } catch (error: any) {
        console.error('Export error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Export failed'
        });
    }
}

/**
 * POST /api/figma/plugin/export/single-component
 * Export single component to existing app
 */
export async function exportSingleComponent(req: Request, res: Response) {
    try {
        const { appName, exportPath, componentData } = req.body;

        if (!appName || !exportPath || !componentData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: appName, exportPath, componentData'
            });
        }

        console.log('📦 Exporting single component:', componentData.componentName);

        // TODO: Implement single component export
        // This should update the fullAppConfig.json and regenerate affected modules

        return res.json({
            success: true,
            message: 'Component exported successfully',
            componentName: componentData.componentName
        });

    } catch (error: any) {
        console.error('Single component export error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Export failed'
        });
    }
}