// figma-api/app-builder/controllers/appBuilderController.ts

/**
 * APP BUILDER CONTROLLER
 * 
 * Main controller for the app builder API endpoint.
 * Orchestrates all services to build a complete app from fullAppConfig.json
 */

import { Request, Response } from 'express';
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
import { categoriseComponents, validateCategorisation, sortRoutes, generateCategorisationReport } from '../services/categoriser.service';
import { copyBaseTemplate, generateTemplateCopySummary } from '../services/templateCopy.service';
import { generateModules, generateModuleSummary, validateGeneratedModules } from '../services/moduleGenerator.service';
import { generateRouters, generateRouterSummary, validateGeneratedRouters } from '../services/routerGenerator.service';
import { getAllRoutes } from '../services/categoriser.service';

/**
 * Main build endpoint handler
 * POST /api/app-builder/build
 */
export async function buildApp(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const buildId = generateBuildId();

    console.log(`\n========================================`);
    console.log(`🚀 App Builder - Build Started`);
    console.log(`Build ID: ${buildId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================\n`);

    try {
        // Extract request data
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

        // Determine output path
        const basePath = targetPath || process.env.APP_BUILD_PATH || '/tmp/generated-apps';
        const appPath = `${basePath}/${config.appName}`;

        console.log(`📦 App Name: ${config.appName}`);
        console.log(`📂 Output Path: ${appPath}`);
        console.log(`⚙️  Options:`, options || 'default');
        console.log('');

        // ========================================
        // PHASE 1: PARSE & VALIDATE
        // ========================================
        console.log(`📋 Phase 1: Parsing configuration...`);
        const parseResult = parseAppConfig(config);

        if (!parseResult.success || !parseResult.normalised) {
            console.log(`❌ Parse failed\n`);
            const errorResponse: AppBuilderErrorResponse = {
                success: false,
                error: 'Configuration validation failed',
                details: 'The provided configuration has errors. See validationErrors for details.',
                validationErrors: parseResult.errors,
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
        }

        console.log(`✓ Parse successful`);
        console.log(`  ${generateParseSummary(parseResult.normalised)}`);

        // Additional validation on normalised components
        const additionalErrors = validateNormalisedComponents(parseResult.normalised);
        const allValidationErrors = [...parseResult.errors, ...additionalErrors];

        if (allValidationErrors.filter(e => e.type === 'error').length > 0) {
            console.log(`❌ Validation failed\n`);
            const errorResponse: AppBuilderErrorResponse = {
                success: false,
                error: 'Component validation failed',
                validationErrors: allValidationErrors,
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
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
            const errorResponse: AppBuilderErrorResponse = {
                success: false,
                error: 'Component categorisation failed',
                details: categoriseResult.warnings.join(', '),
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
            return;
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
        categoriseResult.categorised.bottomNavTabs = sortRoutes(
            [...categoriseResult.categorised.bottomNavTabs, ...categoriseResult.categorised.bottomNavModals],
            'bottomNav'
        ).filter(r => r.type === 'tab');
        categoriseResult.categorised.bottomNavModals = sortRoutes(
            [...categoriseResult.categorised.bottomNavTabs, ...categoriseResult.categorised.bottomNavModals],
            'bottomNav'
        ).filter(r => r.type === 'modal');
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
                const errorResponse: AppBuilderErrorResponse = {
                    success: false,
                    error: 'Template copy failed',
                    details: templateResult.errors.join(', '),
                    timestamp: new Date().toISOString()
                };
                res.status(500).json(errorResponse);
                return;
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
                const errorResponse: AppBuilderErrorResponse = {
                    success: false,
                    error: 'Module generation failed',
                    details: moduleResult.errors.join(', '),
                    timestamp: new Date().toISOString()
                };
                res.status(500).json(errorResponse);
                return;
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
                const errorResponse: AppBuilderErrorResponse = {
                    success: false,
                    error: 'Router generation failed',
                    details: routerResult.errors.join(', '),
                    timestamp: new Date().toISOString()
                };
                res.status(500).json(errorResponse);
                return;
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
        // PHASE 6: BUILD SUMMARY
        // ========================================
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const summary: BuildSummary = {
            appName: config.appName,
            totalComponents: parseResult.normalised.length,
            carouselRoutes: categoriseResult.categorised.carouselRoutes.length,
            bottomNavRoutes: categoriseResult.categorised.bottomNavTabs.length +
                categoriseResult.categorised.bottomNavModals.length,
            childRoutes: categoriseResult.categorised.childRoutes.length,
            generatedFiles: allRoutes.length * 2 + 3, // modules (2 files each) + 3 router files
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

        const successResponse: AppBuilderSuccessResponse = {
            success: true,
            buildId,
            appPath,
            summary,
            timestamp: new Date().toISOString()
        };

        res.status(200).json(successResponse);

    } catch (error) {
        console.log(`\n❌ Build failed with exception\n`);
        console.error(error);

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
 * GET /api/app-builder/health
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
 * GET /api/app-builder/status/:buildId
 */
export function getBuildStatus(req: Request, res: Response): void {
    const { buildId } = req.params;

    // TODO: Implement build status tracking
    res.status(200).json({
        buildId,
        status: 'completed',
        message: 'Build status tracking not yet implemented',
        timestamp: new Date().toISOString()
    });
}

/**
 * Validate config endpoint
 * POST /api/app-builder/validate
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

        // Parse and validate
        const parseResult = parseAppConfig(config);

        if (!parseResult.success || !parseResult.normalised) {
            res.status(200).json({
                valid: false,
                errors: parseResult.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Additional validation
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