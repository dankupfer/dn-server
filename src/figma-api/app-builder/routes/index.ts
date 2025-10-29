// src/figma-api/app-builder/routes/index.ts

/**
 * APP BUILDER ROUTES
 * 
 * Express routes for the app builder API endpoints
 * Includes both local app building and web prototype generation
 */

import { Router } from 'express';
import {
    buildApp,
    healthCheck,
    getBuildStatus,
    validateConfig
} from '../controllers/appBuilder.controller';

// Import prototype routes
import prototypeRoutes from './prototype.routes';

const router = Router();

// ============================================
// LOCAL APP BUILDING
// ============================================

/**
 * POST /api/figma/app-builder/build
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
 * POST /api/figma/app-builder/validate
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
 * GET /api/figma/app-builder/health
 * Health check endpoint
 * 
 * Response:
 * - 200: { status: 'healthy', service: 'app-builder', version: string, timestamp: string }
 */
router.get('/health', healthCheck);

/**
 * GET /api/figma/app-builder/status/:buildId
 * Get status of a build (future implementation)
 * 
 * Response:
 * - 200: { buildId: string, status: string, timestamp: string }
 */
router.get('/status/:buildId', getBuildStatus);

// ============================================
// WEB PROTOTYPE BUILDING
// ============================================

/**
 * Mount prototype routes at /prototype
 * - POST /api/figma/app-builder/prototype/build
 * - GET  /api/figma/app-builder/prototype/status/:jobId
 * - GET  /api/figma/app-builder/prototype/metadata/:uuid
 * - GET  /api/figma/app-builder/prototype/jobs
 */
router.use('/prototype', prototypeRoutes);

export default router;