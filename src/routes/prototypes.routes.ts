// src/routes/prototypes.routes.ts

/**
 * PUBLIC PROTOTYPE VIEWER ROUTES
 * 
 * Serves the actual prototype viewer pages (not API endpoints)
 * These are mounted at the root level, not under /api
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import { servePrototype } from '../figma-api/app-builder/controllers/prototypeBuilder.controller';
import * as prototypeBuilder from '../figma-api/app-builder/services/prototypeBuilder.service';

const router = Router();

/**
 * GET /prototypes/:uuid/bundle/*
 * Serve bundle files for a specific prototype
 * IMPORTANT: This route must come BEFORE the /:uuid route
 */
router.get('/:uuid/bundle/*', async (req: Request, res: Response) => {
    console.log(324324324)
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
            '../../public/prototypes',
            prototype.path,
            'bundle',
            filePath
        );

        console.log(fullPath)

        res.sendFile(fullPath);
    } catch (error: any) {
        console.error('Bundle file error:', error);
        res.status(404).send('File not found');
    }
});

/**
 * Catch any path with /bundle/ in it
 */
router.get('*/bundle/*', async (req: Request, res: Response) => {
    try {
        console.log('🔍 Bundle catch-all request:', req.path);

        // Extract the path before /bundle/
        const match = req.path.match(/^\/(.+?)\/bundle\/(.+)$/);
        if (!match) {
            res.status(404).send('Invalid bundle path');
            return;
        }

        const [, prefix, filePath] = match;
        console.log('📦 Prefix:', prefix, 'File:', filePath);

        // Try as UUID first
        let prototype = await prototypeBuilder.getPrototype(prefix);

        // If not found, it might be a direct path
        if (!prototype && prefix.includes('/')) {
            const fullPath = path.join(
                __dirname,
                '../../public/prototypes',
                prefix,
                'bundle',
                filePath
            );
            console.log('📁 Direct path:', fullPath);
            res.sendFile(fullPath);
            return;
        }

        if (!prototype) {
            res.status(404).send('Prototype not found');
            return;
        }

        const fullPath = path.join(
            __dirname,
            '../../public/prototypes',
            prototype.path,
            'bundle',
            filePath
        );

        console.log('📁 UUID resolved path:', fullPath);
        res.sendFile(fullPath);

    } catch (error: any) {
        console.error('❌ Bundle error:', error);
        res.status(404).send('File not found');
    }
});

/**
 * GET /prototypes/:uuid
 * Serve the prototype viewer page with iPhone frame
 * 
 * This is a PUBLIC route (no /api prefix)
 * Example: http://localhost:3001/prototypes/proto-abc123
 */
router.get('/:uuid', servePrototype);

export default router;