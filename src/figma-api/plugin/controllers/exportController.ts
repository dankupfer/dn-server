// src/figma-api/controllers/exportController.ts
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

interface ExportFullAppRequest {
    appName: string;
    exportPath: string;
    appFrame: {
        appName: string;
        brand?: string;
        mode?: string;
        apiBase?: string;
    };
    components: Array<{
        componentName: string;
        nodeId: string;
        properties: Record<string, any>;
    }>;
}

/**
 * Export full app configuration
 * Creates folder structure and fullAppConfig.json
 */
export async function exportFullApp(req: Request, res: Response) {
    try {
        const data: ExportFullAppRequest = req.body;

        console.log('📦 Export request received for:', data.appName);
        console.log('📁 Export path:', data.exportPath);
        console.log('📊 Components:', data.components.length);

        // Validate request
        if (!data.appName || !data.exportPath) {
            return res.status(400).json({
                success: false,
                error: 'appName and exportPath are required'
            });
        }

        // Create project folder path
        const projectPath = path.join(data.exportPath, data.appName);

        // Create folder if it doesn't exist
        await fs.mkdir(projectPath, { recursive: true });
        console.log('✅ Created project folder:', projectPath);

        // Create fullAppConfig.json
        const config = {
            appName: data.appName,
            appFrame: data.appFrame,
            components: data.components,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const configPath = path.join(projectPath, 'fullAppConfig.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Created fullAppConfig.json');

        res.json({
            success: true,
            message: `Exported ${data.components.length} components to ${data.appName}`,
            filePath: configPath,
            screenCount: data.components.length
        });

    } catch (error) {
        console.error('❌ Export error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        });
    }
}

/**
 * Export single component - updates existing fullAppConfig.json
 */
export async function exportSingleComponent(req: Request, res: Response) {
    try {
        const { appName, exportPath, componentData } = req.body;

        console.log('📦 Single component export request:', componentData.componentName);
        console.log('📁 Target app:', appName);

        // Validate request
        if (!appName || !exportPath || !componentData) {
            return res.status(400).json({
                success: false,
                error: 'appName, exportPath, and componentData are required'
            });
        }

        // Read existing fullAppConfig.json
        const configPath = path.join(exportPath, appName, 'fullAppConfig.json');

        let config: any;
        try {
            const configFile = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configFile);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'fullAppConfig.json not found. Please export full app first.'
            });
        }

        // Find and update or add the component
        const componentIndex = config.components.findIndex(
            (c: any) => c.nodeId === componentData.nodeId || c.properties.id === componentData.properties.id
        );

        const updatedComponent = {
            componentName: componentData.componentName,
            nodeId: componentData.nodeId,
            properties: componentData.properties
        };

        if (componentIndex >= 0) {
            // Update existing component
            config.components[componentIndex] = updatedComponent;
            console.log('✏️ Updated existing component');
        } else {
            // Add new component
            config.components.push(updatedComponent);
            console.log('➕ Added new component');
        }

        // Update timestamp
        config.lastUpdated = new Date().toISOString();

        // Write updated config back to file
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Updated fullAppConfig.json');

        res.json({
            success: true,
            message: `Updated ${componentData.componentName} in ${appName}`,
            componentName: componentData.componentName
        });

    } catch (error) {
        console.error('❌ Single component export error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        });
    }
}