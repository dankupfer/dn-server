// src/figma-api/app-builder/controllers/appBuilder.controller.ts

/**
 * APP BUILDER CONTROLLER
 * 
 * Main controller for building apps from fullAppConfig.json
 * Supports two build types:
 * - 'local': Build app in user-specified location (existing behavior)
 * - 'prototype': Build web prototype for sharing (new behavior)
 */

import { Request, Response } from 'express';
import path from 'path';
import {
    FullAppConfig,
    AppBuilderRequest,
    AppBuilderSuccessResponse,
    AppBuilderErrorResponse,
    BuildSummary,
    ValidationError
} from '../types/appBuilder.types';

// Import services
import { parseAppConfig, validateNormalisedComponents, generateParseSummary } from '../services/parser.service';
import { categoriseComponents, validateCategorisation, sortRoutes, generateCategorisationReport, getAllRoutes } from '../services/categoriser.service';
import { copyBaseTemplate, generateTemplateCopySummary } from '../services/templateCopy.service';
import { generateModules, generateModuleSummary, validateGeneratedModules } from '../services/moduleGenerator.service';
import { generateRouters, generateRouterSummary, validateGeneratedRouters } from '../services/routerGenerator.service';

export type BuildType = 'local' | 'prototype';

export interface BuildOptions {
    dryRun?: boolean;
    buildType?: BuildType;
    // Prototype-specific options
    figmaFileId?: string;
    figmaFileName?: string;
    figmaPageName?: string;
}

/**
 * Main build function - can be called directly or via HTTP
 */
export async function executeBuild(
    config: FullAppConfig,
    targetPath?: string,
    options: BuildOptions = {}
): Promise<{ success: boolean; result?: any; error?: string; summary?: BuildSummary }> {
    const startTime = Date.now();
    const buildType = options.buildType || 'local';

    console.log(`\n========================================`);
    console.log(`🚀 App Builder - ${buildType === 'prototype' ? 'Prototype' : 'Local'} Build Started`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================\n`);

    try {
        // Determine output path based on build type
        let appPath: string;

        if (buildType === 'prototype') {
            // Prototype builds go to public/prototypes/{file}/{page}/{app}/temp
            const { figmaFileName = 'unknown', figmaPageName = 'unknown' } = options;
            const safeName = (name: string) => name.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();

            appPath = path.join(
                __dirname,
                '../../../../public/prototypes',
                safeName(figmaFileName),
                safeName(figmaPageName),
                safeName(config.appName),
                'temp'
            );
        } else {
            // Local builds go to user-specified path
            const basePath = targetPath || process.env.APP_BUILD_PATH || '/tmp/generated-apps';
            appPath = `${basePath}/${config.appName}`;
        }

        console.log(`📦 App Name: ${config.appName}`);
        console.log(`📂 Output Path: ${appPath}`);
        console.log(`🏗️  Build Type: ${buildType}`);
        console.log('');

        // ========================================
        // PHASE 1: PARSE & VALIDATE
        // ========================================
        console.log(`📋 Phase 1: Parsing configuration...`);
        const parseResult = parseAppConfig(config);

        if (!parseResult.success || !parseResult.normalised) {
            console.log(`❌ Parse failed\n`);
            return {
                success: false,
                error: 'Configuration validation failed',
            };
        }

        console.log(`✓ Parse successful`);
        console.log(`  ${generateParseSummary(parseResult.normalised)}`);

        // Additional validation on normalised components
        const additionalErrors = validateNormalisedComponents(parseResult.normalised);
        const allValidationErrors = [...parseResult.errors, ...additionalErrors];

        if (allValidationErrors.filter(e => e.type === 'error').length > 0) {
            console.log(`❌ Validation failed\n`);
            return {
                success: false,
                error: 'Component validation failed'
            };
        }

        // Log warnings if any
        const warnings = allValidationErrors.filter(e => e.type === 'warning');
        if (warnings.length > 0) {
            console.log(`⚠️  Warnings (${warnings.length}):`);
            warnings.forEach(w => console.log(`    ${w.message}`));
        }
        console.log('');

        // ========================================
        // PHASE 2: CATEGORISE
        // ========================================
        console.log(`📊 Phase 2: Categorising components...`);
        const categoriseResult = categoriseComponents(parseResult.normalised);

        if (!categoriseResult.success || !categoriseResult.categorised) {
            console.log(`❌ Categorisation failed\n`);
            return {
                success: false,
                error: 'Component categorisation failed'
            };
        }

        console.log(`✓ Categorisation successful`);
        console.log(generateCategorisationReport(categoriseResult));

        // Validate categorisation
        const categorisationErrors = validateCategorisation(categoriseResult.categorised);
        if (categorisationErrors.length > 0) {
            console.log(`⚠️  Categorisation warnings:`);
            categorisationErrors.forEach(e => console.log(`    ${e}`));
            console.log('');
        }

        // Sort routes for consistent ordering
        categoriseResult.categorised.carouselRoutes = sortRoutes(
            categoriseResult.categorised.carouselRoutes,
            'carousel'
        );
        categoriseResult.categorised.bottomNavRoutes = sortRoutes(
            categoriseResult.categorised.bottomNavRoutes,
            'bottomNav'
        );
        categoriseResult.categorised.childRoutes = sortRoutes(
            categoriseResult.categorised.childRoutes,
            'child'
        );

        // ========================================
        // PHASE 3: COPY BASE TEMPLATE
        // ========================================
        console.log(`📋 Phase 3: Copying base template...`);

        if (options?.dryRun) {
            console.log(`  ⚠️  DRY RUN MODE - Would copy template files\n`);
        } else {
            const templateResult = await copyBaseTemplate(config.appName, appPath);

            if (!templateResult.success) {
                console.log(`❌ Template copy failed\n`);
                return {
                    success: false,
                    error: 'Template copy failed'
                };
            }

            console.log(`✓ Template copy successful`);
            console.log(generateTemplateCopySummary(templateResult));
        }

        // ========================================
        // PHASE 4: GENERATE MODULES
        // ========================================
        console.log(`🔨 Phase 4: Generating modules...`);

        if (options?.dryRun) {
            console.log(`  ⚠️  DRY RUN MODE - No files will be written\n`);
        }

        // Get all routes to generate
        const allRoutes = getAllRoutes(categoriseResult.categorised);

        if (options?.dryRun) {
            console.log(`  Would generate ${allRoutes.length} modules\n`);
        } else {
            const moduleResult = await generateModules(
                config.appName,
                allRoutes,
                appPath
            );

            if (!moduleResult.success) {
                console.log(`❌ Module generation failed\n`);
                return {
                    success: false,
                    error: 'Module generation failed'
                };
            }

            console.log(`✓ Module generation successful`);
            console.log(generateModuleSummary(moduleResult));

            // Validate generated modules
            const moduleValidationErrors = await validateGeneratedModules(moduleResult.modules);
            if (moduleValidationErrors.length > 0) {
                console.log(`⚠️  Module validation warnings:`);
                moduleValidationErrors.forEach(e => console.log(`    ${e}`));
                console.log('');
            }
        }

        // ========================================
        // PHASE 5: GENERATE ROUTERS
        // ========================================
        console.log(`🗺️  Phase 5: Generating router files...`);

        if (options?.dryRun) {
            console.log(`  Would generate 3 router files\n`);
        } else {
            const routerResult = await generateRouters(
                config.appName,
                categoriseResult.categorised,
                appPath
            );

            if (!routerResult.success) {
                console.log(`❌ Router generation failed\n`);
                return {
                    success: false,
                    error: 'Router generation failed'
                };
            }

            console.log(`✓ Router generation successful`);
            console.log(generateRouterSummary(routerResult));

            // Validate generated routers
            const routerValidationErrors = await validateGeneratedRouters(routerResult.routers);
            if (routerValidationErrors.length > 0) {
                console.log(`⚠️  Router validation warnings:`);
                routerValidationErrors.forEach(e => console.log(`    ${e}`));
                console.log('');
            }
        }

        // ========================================
        // BUILD SUMMARY
        // ========================================
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const summary: BuildSummary = {
            appName: config.appName,
            totalComponents: parseResult.normalised.length,
            carouselRoutes: categoriseResult.categorised.carouselRoutes.length,
            bottomNavRoutes: categoriseResult.categorised.bottomNavRoutes.length,
            childRoutes: categoriseResult.categorised.childRoutes.length,
            generatedFiles: allRoutes.length * 2 + 3,
            warnings: [
                ...warnings.map(w => w.message),
                ...categoriseResult.warnings,
                ...categorisationErrors
            ]
        };

        console.log(`========================================`);
        console.log(`✅ Build Complete`);
        console.log(`========================================`);
        console.log(`App: ${summary.appName}`);
        console.log(`Components: ${summary.totalComponents}`);
        console.log(`  - Carousel: ${summary.carouselRoutes}`);
        console.log(`  - Bottom Nav: ${summary.bottomNavRoutes}`);
        console.log(`  - Child: ${summary.childRoutes}`);
        console.log(`Files: ${summary.generatedFiles}`);
        console.log(`Duration: ${duration}s`);
        if (summary.warnings.length > 0) {
            console.log(`Warnings: ${summary.warnings.length}`);
        }
        console.log(`========================================\n`);

        return {
            success: true,
            result: {
                appPath,
                buildType,
                duration: parseFloat(duration)
            },
            summary
        };

    } catch (error) {
        console.log(`\n❌ Build failed with exception\n`);
        console.error(error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * HTTP endpoint handler for local builds
 * POST /api/figma/app-builder/build
 */
export async function buildApp(req: Request, res: Response): Promise<void> {
    const buildId = generateBuildId();

    try {
        const { config, targetPath, options } = req.body as AppBuilderRequest;

        if (!config) {
            const errorResponse: AppBuilderErrorResponse = {
                success: false,
                error: 'Missing configuration',
                details: 'Request body must include "config" field with fullAppConfig.json',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Execute build with 'local' type
        const result = await executeBuild(config, targetPath, { ...options, buildType: 'local' });

        if (!result.success) {
            const errorResponse: AppBuilderErrorResponse = {
                success: false,
                error: result.error || 'Build failed',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
            return;
        }

        const successResponse: AppBuilderSuccessResponse = {
            success: true,
            buildId,
            appPath: result.result.appPath,
            summary: result.summary!,
            timestamp: new Date().toISOString()
        };

        res.status(200).json(successResponse);

    } catch (error) {
        console.error('Build error:', error);
        const errorResponse: AppBuilderErrorResponse = {
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(errorResponse);
    }
}

/**
 * Generate unique build ID
 */
function generateBuildId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `build-${timestamp}-${random}`;
}

/**
 * Health check endpoint
 * GET /api/figma/app-builder/health
 */
export function healthCheck(req: Request, res: Response): void {
    res.status(200).json({
        status: 'healthy',
        service: 'app-builder',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
}

/**
 * Get build status endpoint (future)
 * GET /api/figma/app-builder/status/:buildId
 */
export function getBuildStatus(req: Request, res: Response): void {
    const { buildId } = req.params;

    res.status(200).json({
        buildId,
        status: 'completed',
        message: 'Build status tracking not yet implemented',
        timestamp: new Date().toISOString()
    });
}

/**
 * Validate config endpoint
 * POST /api/figma/app-builder/validate
 */
export function validateConfig(req: Request, res: Response): void {
    try {
        const config = req.body as FullAppConfig;

        if (!config) {
            res.status(400).json({
                valid: false,
                error: 'Missing configuration',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const parseResult = parseAppConfig(config);

        if (!parseResult.success || !parseResult.normalised) {
            res.status(200).json({
                valid: false,
                errors: parseResult.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const additionalErrors = validateNormalisedComponents(parseResult.normalised);
        const allErrors = [...parseResult.errors, ...additionalErrors];

        const hasErrors = allErrors.filter(e => e.type === 'error').length > 0;
        const warnings = allErrors.filter(e => e.type === 'warning');

        res.status(200).json({
            valid: !hasErrors,
            summary: generateParseSummary(parseResult.normalised),
            errors: allErrors.filter(e => e.type === 'error'),
            warnings: warnings,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            valid: false,
            error: 'Validation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Build app programmatically (for plugin export)
 * Returns result instead of sending response
 */
export async function buildAppForExport(config: {
    appName: string;
    exportPath: string;
    appFrame: any;
    components: any[];
}): Promise<{ success: boolean; appPath: string; error?: string }> {
    try {
        const fullAppConfig = {
            appName: config.appName,
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            appFrame: config.appFrame,
            components: config.components
        };

        const result = await executeBuild(fullAppConfig, config.exportPath);

        if (result.success && result.result) {
            return {
                success: true,
                appPath: result.result.appPath // Fixed: use result.result.appPath
            };
        } else {
            return {
                success: false,
                appPath: '',
                error: result.error || 'Build failed'
            };
        }
    } catch (error: any) {
        return {
            success: false,
            appPath: '',
            error: error.message
        };
    }
}