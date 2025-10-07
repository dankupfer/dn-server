// src/routes/figma/index.ts
import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { CreateModuleRequest, CreateModuleResponse } from '../../types';

const router = Router();

// Main endpoint for creating modules
router.post('/create-module', async (req: Request<{}, CreateModuleResponse, CreateModuleRequest>, res: Response<CreateModuleResponse>) => {
  try {
    const { moduleName, moduleId, screenData, folderPath, targetSection } = req.body;

    console.log(`📦 Creating module: ${moduleName} (${moduleId})`);
    console.log(`📁 Target folder: ${folderPath}`);

    // Validate required fields
    if (!moduleName || !moduleId || !screenData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: moduleName, moduleId, or screenData'
      });
    }

    // Default folder path if not provided
    // NOTE: This assumes dn-server is sibling to dn-starter
    const targetPath = folderPath || path.join(process.cwd(), '..', 'dn-starter', 'template', 'src', 'modules', 'feature', moduleId);

    // Create module folder
    await fs.ensureDir(targetPath);
    console.log(`✅ Created directory: ${targetPath}`);

    // Generate module files
    const indexContent = generateModuleIndex(moduleName, moduleId);
    const screenDataContent = JSON.stringify(screenData, null, 2);

    // Write files
    await fs.writeFile(path.join(targetPath, 'index.tsx'), indexContent);
    await fs.writeFile(path.join(targetPath, 'screenData.json'), screenDataContent);

    console.log('✅ Files written successfully');

    // Update screenRoutes.tsx to include new module
    await updateScreenRoutes(moduleId, moduleName, targetSection);

    res.json({
      success: true,
      message: `Module "${moduleName}" created successfully`,
      files: [
        path.join(targetPath, 'index.tsx'),
        path.join(targetPath, 'screenData.json')
      ],
      moduleId,
      moduleName
    });

  } catch (error) {
    console.error('❌ Error creating module:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to update screenRoutes.tsx
async function updateScreenRoutes(moduleId: string, moduleName: string, targetSection?: string): Promise<void> {
  const screenRoutesPath = path.join(process.cwd(), '..', 'dn-starter', 'template', 'src', 'modules', 'core', 'combined-auth', 'screenRoutes.tsx');

  try {
    // Check if screenRoutes.tsx exists
    if (!await fs.pathExists(screenRoutesPath)) {
      console.log(`⚠️  screenRoutes.tsx not found at ${screenRoutesPath}, skipping route update`);
      return;
    }

    // Read existing file
    const content = await fs.readFile(screenRoutesPath, 'utf-8');

    // Extract existing imports (everything between first import and export interface)
    const importMatches = content.match(/^import .+ from .+;$/gm) || [];
    const existingImports = new Set(importMatches);

    // Extract existing routes from the array
    const routeArrayMatch = content.match(/export const screenRoutes: ScreenRoute\[\] = \[([\s\S]*?)\];/);
    if (!routeArrayMatch) {
      throw new Error('Could not find screenRoutes array in file');
    }

    const routesContent = routeArrayMatch[1];
    const routeMatches = routesContent.match(/{\s*id:\s*'([^']+)'[^}]+}/g) || [];

    // Parse existing routes
    const existingRoutes: Array<{ id: string, name: string, component: string }> = [];
    for (const routeMatch of routeMatches) {
      const idMatch = routeMatch.match(/id:\s*'([^']+)'/);
      const nameMatch = routeMatch.match(/name:\s*'([^']+)'/);
      const componentMatch = routeMatch.match(/component:\s*(\w+)/);

      if (idMatch && nameMatch && componentMatch) {
        existingRoutes.push({
          id: idMatch[1],
          name: nameMatch[1],
          component: componentMatch[1]
        });
      }
    }

    // Generate new import statement
    const newImport = `import ${moduleName} from '../../feature/${moduleId}';`;

    // Add new import if it doesn't exist
    if (!existingImports.has(newImport)) {
      existingImports.add(newImport);
      console.log(`✅ Will add import for ${moduleName}`);
    } else {
      console.log(`⚠️  Import for ${moduleName} already exists`);
    }

    // Determine route details
    const routeId = targetSection || moduleId;
    const routeName = targetSection ? targetSection.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') : moduleName;

    // Add or update the route
    const newRoute = { id: routeId, name: routeName, component: moduleName };
    const existingRouteIndex = existingRoutes.findIndex(route => route.id === routeId);

    if (existingRouteIndex >= 0) {
      // Update existing route
      existingRoutes[existingRouteIndex] = newRoute;
      console.log(`✅ Will update existing route for ${routeId} with ${moduleName} component`);
    } else {
      // Add new route
      existingRoutes.push(newRoute);
      console.log(`✅ Will add new route for ${routeId} with ${moduleName} component`);
    }

    // Generate the complete file content
    const sortedImports = Array.from(existingImports);
    const fileContent = `// template/modules/core/combined-auth/screenRoutes.tsx
${sortedImports.join('\n')}

export interface ScreenRoute {
  id: string;
  name: string;
  component: React.ComponentType<{ screenWidth: number }>;
}

export const screenRoutes: ScreenRoute[] = [
${existingRoutes.map(route => `  { id: '${route.id}', name: '${route.name}', component: ${route.component} },`).join('\n')}
  // Plugin will add new routes here
];
`;

    // Write the complete file
    await fs.writeFile(screenRoutesPath, fileContent);
    console.log(`✅ Successfully updated screenRoutes.tsx with proper formatting`);

  } catch (error) {
    console.error('❌ Error updating screenRoutes.tsx:', error);
    throw error;
  }
}

function generateModuleIndex(moduleName: string, moduleId: string): string {
  return `// Generated by DN Figma Bridge
import React from 'react';
import { ScreenBuilder, type ScreenConfig } from '@dankupfer/dn-components';
import screenData from './screenData.json';

interface ${moduleName}Props {
  screenWidth: number;
}

const ${moduleName}: React.FC<${moduleName}Props> = ({ screenWidth }) => {
  const config = screenData as ScreenConfig;
  
  return (
    <ScreenBuilder 
      config={config} 
      screenWidth={screenWidth} 
    />
  );
};

export default ${moduleName};
`;
}

export default router;