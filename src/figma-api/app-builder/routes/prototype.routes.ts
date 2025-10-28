// src/figma-api/app-builder/routes/prototype.routes.ts

/**
 * PROTOTYPE BUILDER ROUTES
 * 
 * Express routes for building shareable web prototypes
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import {
    buildPrototype,
    getBuildStatus,
    servePrototype,
    getPrototypeMetadata,
    getAllJobs
} from '../controllers/prototypeBuilder.controller';
import * as prototypeBuilder from '../services/prototypeBuilder.service';

const router = Router();

/**
 * POST /api/figma/app-builder/prototype/build
 * Start async web prototype build
 * 
 * Request body:
 * {
 *   figmaFileId: string,
 *   figmaFileName: string,
 *   figmaPageName: string,
 *   appName: string,
 *   fullAppConfig: object
 * }
 * 
 * Response:
 * - 202: { jobId: string, status: 'building', estimatedTime: number }
 * - 400: { error: string, required: string[] }
 * - 500: { error: string, message: string }
 */
router.post('/build', buildPrototype);

/**
 * GET /api/figma/app-builder/prototype/status/:jobId
 * Get build status for async job
 * 
 * Response:
 * - 200: { jobId, status, progress, currentStep, result?, error? }
 * - 404: { error: 'Job not found', jobId }
 * - 500: { error: string, message: string }
 */
router.get('/status/:jobId', getBuildStatus);

/**
 * GET /api/figma/app-builder/prototype/metadata/:uuid
 * Get prototype metadata (views, creation date, etc.)
 * 
 * Response:
 * - 200: { uuid, path, figmaFileId, createdAt, views, lastViewed }
 * - 404: { error: 'Prototype not found', uuid }
 * - 500: { error: string, message: string }
 */
router.get('/metadata/:uuid', getPrototypeMetadata);

/**
 * GET /api/figma/app-builder/prototype/jobs
 * Get all jobs (debug endpoint)
 * 
 * Response:
 * - 200: { jobs: BuildJob[] }
 */
router.get('/jobs', getAllJobs);

/**
 * GET /prototypes/:uuid/bundle/*
 * Serve bundle files for a specific prototype
 * IMPORTANT: This route must come BEFORE the /:uuid route
 * 
 * Response:
 * - 200: File content
 * - 404: Prototype or file not found
 */
router.get('/:uuid/bundle/*', async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const filePath = req.params[0]; // Everything after /bundle/

        const prototype = await prototypeBuilder.getPrototype(uuid);

        if (!prototype) {
            res.status(404).send('Prototype not found');
            return;
        }

        const fullPath = path.join(
            __dirname,
            '../../../../public/prototypes',
            prototype.path,
            'bundle',
            filePath
        );

        res.sendFile(fullPath);
    } catch (error: any) {
        console.error('Bundle file error:', error);
        res.status(404).send('File not found');
    }
});

/**
 * GET /prototypes/:uuid
 * Serve the prototype viewer
 * 
 * Response:
 * - 200: Viewer HTML with iPhone frame
 * - 404: Prototype not found
 * - 500: Server error
 */
router.get('/:uuid', servePrototype);

export default router;