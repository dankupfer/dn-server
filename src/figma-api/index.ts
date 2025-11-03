// src/figma-api/index.ts

/**
 * FIGMA API MAIN ROUTER
 * 
 * Aggregates all Figma-related routes:
 * - Plugin routes (UI, definitions, forms, exports)
 * - App Builder routes (local builds, web prototypes)
 */

import express from 'express';
import pluginRoutes from './plugin/routes/plugin.routes';
import appBuilderRoutes from './app-builder/routes';

const router = express.Router();

/**
 * PLUGIN ROUTES
 * Mount at: /api/figma/plugin
 * 
 * Endpoints:
 * - GET  /api/figma/plugin/ui
 * - POST /api/figma/plugin/export/full-app
 * - POST /api/figma/plugin/export/single-component
 * - POST /api/figma/plugin/form-config
 * - POST /api/figma/plugin/conditional-rules
 * - POST /api/figma/plugin/conditional-options
 * - GET  /api/figma/plugin/component-definitions
 * - GET  /api/figma/plugin/component-configurations/:componentName
 * - GET  /api/figma/plugin/definitions/:type
 * - POST /api/figma/plugin/generate-customer
 * - POST /api/figma/plugin/create-module
 */
router.use('/plugin', pluginRoutes);

/**
 * APP BUILDER ROUTES
 * Mount at: /api/figma/app-builder
 * 
 * Endpoints:
 * - POST /api/figma/app-builder/build
 * - POST /api/figma/app-builder/validate
 * - GET  /api/figma/app-builder/health
 * - GET  /api/figma/app-builder/status/:buildId
 * - POST /api/figma/app-builder/prototype/build
 * - GET  /api/figma/app-builder/prototype/status/:jobId
 * - GET  /api/figma/app-builder/prototype/metadata/:uuid
 * - GET  /api/figma/app-builder/prototype/jobs
 */
router.use('/app-builder', appBuilderRoutes);

export default router;