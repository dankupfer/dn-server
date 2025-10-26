// src/figma-api/routes/index.ts
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { FigmaController } from '../controllers/figmaController';
import formBuilder from '../services/formBuilder.service';
import { generateCustomerWithAI } from '../../services/ai/customerGenerator';

const router = express.Router();
const figmaController = new FigmaController();

// Serve the main plugin UI
router.get('/plugin-ui', (req: Request, res: Response) => {
  try {
    const html = figmaController.renderPluginUI();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error rendering plugin UI:', error);
    res.status(500).send('Error loading plugin UI');
  }
});

// Get available journey options
router.get('/journey-options', (req: Request, res: Response) => {
  try {
    console.log('📋 Getting available journey options');

    const journeyOptions = formBuilder.getAvailableJourneyOptions();

    res.json({
      success: true,
      data: journeyOptions
    });

  } catch (error) {
    console.error('Error getting journey options:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get form configuration for a specific journey option
router.get('/form-config/:journeyOption', (req: Request, res: Response) => {
  try {
    const { journeyOption } = req.params;
    console.log('📋 Getting form config for journey option:', journeyOption);

    const formConfig = formBuilder.buildForm(journeyOption);

    if (!formConfig) {
      return res.status(404).json({
        success: false,
        error: `Unknown journey option: ${journeyOption}`
      });
    }

    res.json({
      success: true,
      data: formConfig
    });

  } catch (error) {
    console.error('Error building form:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get field definitions
router.get('/field-definitions', (req: Request, res: Response) => {
  try {
    console.log('📋 Getting field definitions');

    const commonDefinitions = formBuilder.getcommonDefinitions();

    res.json({
      success: true,
      data: commonDefinitions
    });

  } catch (error) {
    console.error('Error getting field definitions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create module from Figma selection
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

// Generate customer data
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

// Get component definitions (for Figma component generation)
router.get('/definitions/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    console.log(`📋 Getting ${type} definitions`);

    let definitionsPath: string;

    switch (type) {
      case 'journeys':
        definitionsPath = path.join(__dirname, '../../figma-api/definitions/journeys.json');
        break;
      case 'components':
        definitionsPath = path.join(__dirname, '../../figma-api/definitions/components.json');
        break;
      case 'frames':
        definitionsPath = path.join(__dirname, '../../figma-api/definitions/frames.json');
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

export default router;