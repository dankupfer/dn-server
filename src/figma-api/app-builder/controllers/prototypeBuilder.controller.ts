// src/figma-api/app-builder/controllers/prototypeBuilder.controller.ts

import { Request, Response } from 'express';
import * as prototypeBuilder from '../services/prototypeBuilder.service';
import * as jobQueue from '../services/jobQueue.service';
import path from 'path';

/**
 * POST /api/prototype/build
 * Start an async prototype build
 */
export async function buildPrototype(req: Request, res: Response): Promise<void> {
    try {
        const { figmaFileId, figmaFileName, figmaPageName, appName, fullAppConfig } = req.body;

        // Validation
        if (!figmaFileId || !figmaFileName || !figmaPageName || !appName || !fullAppConfig) {
            res.status(400).json({
                error: 'Missing required fields',
                required: ['figmaFileId', 'figmaFileName', 'figmaPageName', 'appName', 'fullAppConfig']
            });
            return;
        }

        // Start build
        const jobId = await prototypeBuilder.startBuild({
            figmaFileId,
            figmaFileName,
            figmaPageName,
            appName,
            fullAppConfig
        });

        // Return job ID immediately
        res.status(202).json({
            jobId,
            status: 'building',
            estimatedTime: 60,
            message: 'Build started. Poll /api/prototype/status/{jobId} for progress.'
        });

    } catch (error: any) {
        console.error('Build start error:', error);
        res.status(500).json({
            error: 'Failed to start build',
            message: error.message
        });
    }
}

/**
 * GET /api/prototype/status/:jobId
 * Get build status
 */
export async function getBuildStatus(req: Request, res: Response): Promise<void> {
    try {
        const { jobId } = req.params;

        const job = jobQueue.getJob(jobId);

        if (!job) {
            res.status(404).json({
                error: 'Job not found',
                jobId
            });
            return;
        }

        // Return job status
        res.json({
            jobId: job.jobId,
            status: job.status,
            progress: job.progress,
            currentStep: job.currentStep,
            ...(job.result && { result: job.result }),
            ...(job.error && { error: job.error, errorCode: job.errorCode, canRetry: job.canRetry }),
            createdAt: job.createdAt,
            ...(job.startedAt && { startedAt: job.startedAt }),
            ...(job.completedAt && { completedAt: job.completedAt })
        });

    } catch (error: any) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: 'Failed to get status',
            message: error.message
        });
    }
}

/**
 * GET /prototypes/:uuid
 * Serve prototype viewer
 */
export async function servePrototype(req: Request, res: Response): Promise<void> {
    try {
        const { uuid } = req.params;

        // Get prototype mapping
        const prototype = await prototypeBuilder.getPrototype(uuid);

        if (!prototype) {
            res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prototype Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 48px; margin: 0 0 20px 0; }
            p { font-size: 18px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404</h1>
            <p>Prototype not found</p>
            <p style="font-size: 14px; margin-top: 20px;">UUID: ${uuid}</p>
          </div>
        </body>
        </html>
      `);
            return;
        }

        // Increment view count
        await prototypeBuilder.incrementViews(uuid);

        // Serve the viewer HTML
        const viewerPath = path.join(
            __dirname,
            '../../../../public/prototypes',
            prototype.path,
            'index.html'
        );

        console.log(viewerPath)
        res.sendFile(viewerPath);

    } catch (error: any) {
        console.error('Serve prototype error:', error);
        res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 48px; margin: 0 0 20px 0; }
          p { font-size: 18px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error</h1>
          <p>Failed to load prototype</p>
          <p style="font-size: 14px; margin-top: 20px;">${error.message}</p>
        </div>
      </body>
      </html>
    `);
    }
}

/**
 * GET /api/prototype/metadata/:uuid
 * Get prototype metadata
 */
export async function getPrototypeMetadata(req: Request, res: Response): Promise<void> {
    try {
        const { uuid } = req.params;

        const prototype = await prototypeBuilder.getPrototype(uuid);

        if (!prototype) {
            res.status(404).json({
                error: 'Prototype not found',
                uuid
            });
            return;
        }

        res.json({
            uuid,
            ...prototype
        });

    } catch (error: any) {
        console.error('Metadata error:', error);
        res.status(500).json({
            error: 'Failed to get metadata',
            message: error.message
        });
    }
}

/**
 * GET /api/prototype/jobs
 * Get all jobs (debug endpoint)
 */
export async function getAllJobs(req: Request, res: Response): Promise<void> {
    try {
        const jobs = jobQueue.getAllJobs();
        res.json({ jobs });
    } catch (error: any) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            error: 'Failed to get jobs',
            message: error.message
        });
    }
}