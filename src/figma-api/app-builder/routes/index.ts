// figma-api/app-builder/routes/index.ts

/**
 * APP BUILDER ROUTES
 * 
 * Express routes for the app builder API endpoints
 */

import { Router } from 'express';
import {
    buildApp,
    healthCheck,
    getBuildStatus,
    validateConfig
} from '../controllers/appBuilderController';

const router = Router();

/**
 * POST /api/app-builder/build
 * Build a complete app from fullAppConfig.json
 * 
 * Request body:
 * {
 *   config: FullAppConfig,
 *   targetPath?: string,
 *   options?: BuildOptions
 * }
 * 
 * Response:
 * - 200: AppBuilderSuccessResponse
 * - 400: AppBuilderErrorResponse (validation failed)
 * - 500: AppBuilderErrorResponse (internal error)
 */
router.post('/build', buildApp);

/**
 * POST /api/app-builder/validate
 * Validate fullAppConfig.json without building
 * 
 * Request body: FullAppConfig
 * 
 * Response:
 * - 200: { valid: boolean, errors: ValidationError[], warnings: ValidationError[] }
 * - 500: { valid: false, error: string }
 */
router.post('/validate', validateConfig);

/**
 * GET /api/app-builder/health
 * Health check endpoint
 * 
 * Response:
 * - 200: { status: 'healthy', service: 'app-builder', version: string, timestamp: string }
 */
router.get('/health', healthCheck);

/**
 * GET /api/app-builder/status/:buildId
 * Get status of a build (future implementation)
 * 
 * Response:
 * - 200: { buildId: string, status: string, timestamp: string }
 */
router.get('/status/:buildId', getBuildStatus);

export default router;