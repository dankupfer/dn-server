// src/figma-api/plugin/routes/index.ts

/**
 * FIGMA PLUGIN ROUTES
 * 
 * All routes related to the Figma plugin UI, definitions, exports, and forms
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { FigmaController } from '../controllers/figmaController';
import { generateCustomerWithAI } from '../../../services/ai/customerGenerator';
import { exportFullApp, exportSingleComponent } from '../controllers/exportController';
import * as figmaApiController from '../controllers/figmaApiController';

const router = express.Router();
const figmaController = new FigmaController();

// ============================================
// PLUGIN UI
// ============================================

/**
 * GET /api/figma/plugin/ui
 * Serve the main plugin UI
 */
router.get('/ui', (req: Request, res: Response) => {
    try {
        const html = figmaController.renderPluginUI();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error rendering plugin UI:', error);
        res.status(500).send('Error loading plugin UI');
    }
});

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * POST /api/figma/plugin/export/full-app
 * Export full app configuration
 */
router.post('/export/full-app', exportFullApp);

/**
 * POST /api/figma/plugin/export/single-component
 * Export single component
 */
router.post('/export/single-component', exportSingleComponent);

// ============================================
// FORM & CONFIGURATION API
// ============================================

/**
 * POST /api/figma/plugin/form-config
 * Generic form configuration endpoint - works for ANY component
 */
router.post('/form-config', figmaApiController.getFormConfig);

/**
 * POST /api/figma/plugin/conditional-rules
 * Evaluate conditional rules and return affected fields
 */
router.post('/conditional-rules', figmaApiController.getConditionalRules);

/**
 * POST /api/figma/plugin/conditional-options
 * Get options for a conditional dropdown
 */
router.post('/conditional-options', figmaApiController.getConditionalOptions);

/**
 * GET /api/figma/plugin/component-definitions
 * Get all component definitions
 */
router.get('/component-definitions', figmaApiController.getComponentDefinitions);

/**
 * GET /api/figma/plugin/component-configurations/:componentName
 * Get available configurations for a component
 */
router.get('/component-configurations/:componentName', figmaApiController.getComponentConfigurations);

// ============================================
// DEFINITIONS
// ============================================

/**
 * GET /api/figma/plugin/definitions/:type
 * Get component definitions (journeys, components, frames)
 */
router.get('/definitions/:type', (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        console.log(`📋 Getting ${type} definitions`);

        let definitionsPath: string;

        switch (type) {
            case 'journeys':
                definitionsPath = path.join(__dirname, '../definitions/journeys.json');
                break;
            case 'components':
                definitionsPath = path.join(__dirname, '../definitions/components.json');
                break;
            case 'frames':
                definitionsPath = path.join(__dirname, '../definitions/frames.json');
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown definition type: ${type}`
                });
        }

        const definitions = JSON.parse(fs.readFileSync(definitionsPath, 'utf8'));

        res.json({
            success: true,
            data: definitions
        });

    } catch (error) {
        console.error('Error getting definitions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============================================
// AI / CUSTOMER GENERATION
// ============================================

/**
 * POST /api/figma/plugin/generate-customer
 * Generate customer data using AI
 */
router.post('/generate-customer', async (req: Request, res: Response) => {
    try {
        const customerData = req.body;
        console.log('👤 Generating customer:', customerData.customerName);

        const result = await generateCustomerWithAI(customerData);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    customerId: result.customerId,
                    customerName: result.customerName,
                    filePath: result.filePath
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to generate customer'
            });
        }

    } catch (error) {
        console.error('Error generating customer:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============================================
// MODULE CREATION (LEGACY - might move to app-builder)
// ============================================

/**
 * POST /api/figma/plugin/create-module
 * Create module from Figma selection
 */
router.post('/create-module', async (req: Request, res: Response) => {
    try {
        const {
            moduleName,
            moduleId,
            screenData,
            frameType,
            folderPath,
            targetSection,
            routerName
        } = req.body;

        console.log('📦 Creating module:', moduleName);

        // TODO: Implement module creation logic
        // This will write files to the React Native project

        res.json({
            success: true,
            message: `Module ${moduleName} created successfully`,
            files: [`src/modules/${moduleId}/index.tsx`, `src/modules/${moduleId}/screenData.json`],
            moduleId,
            moduleName
        });

    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;