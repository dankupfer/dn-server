// src/routes/figma/index.ts
import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { CreateModuleRequest, CreateModuleResponse } from '../../types';

const router = Router();

// Validation function to check if paths exist
async function validatePaths(basePath: string, routerName: string): Promise<{ valid: boolean; error?: string }> {
  // Check if base path exists
  if (!await fs.pathExists(basePath)) {
    return {
      valid: false,
      error: `Project path does not exist: ${basePath}\n\nPlease check that you've provided the correct absolute path to your project folder.`
    };
  }

  // Check if it's actually a project (has src folder)
  const srcPath = path.join(basePath, 'src');
  if (!await fs.pathExists(srcPath)) {
    return {
      valid: false,
      error: `The path exists but doesn't appear to be a valid project.\n\nMissing 'src' folder at: ${basePath}\n\nMake sure you're pointing to the root of your React Native project.`
    };
  }

  // Check if router module exists in this project
  const routerPath = path.join(basePath, 'src', 'modules', 'core', routerName);
  if (!await fs.pathExists(routerPath)) {
    return {
      valid: false,
      error: `Router module '${routerName}' not found in this project.\n\nExpected location: ${routerPath}\n\nPlease check:\n1. The router module name is correct\n2. You're using the right project path\n3. The router module exists in src/modules/core/`
    };
  }

  // Check if screenRoutes.tsx exists in the router module
  const screenRoutesPath = path.join(routerPath, 'screenRoutes.tsx');
  if (!await fs.pathExists(screenRoutesPath)) {
    return {
      valid: false,
      error: `Router module exists but missing screenRoutes.tsx\n\nExpected file: ${screenRoutesPath}\n\nThe router module must contain a screenRoutes.tsx file.`
    };
  }

  return { valid: true };
}

// Main endpoint for creating modules
router.post('/create-module', async (req: Request<{}, CreateModuleResponse, CreateModuleRequest>, res: Response<CreateModuleResponse>) => {
  try {
    const { moduleName, moduleId, screenData, folderPath, targetSection, routerName } = req.body;

    console.log(`📦 Creating module: ${moduleName} (${moduleId})`);
    console.log(`📁 Target folder: ${folderPath}`);
    console.log(`🧭 Router name: ${routerName}`);

    // Validate required fields
    if (!moduleName || !moduleId || !screenData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: moduleName, moduleId, or screenData'
      });
    }

    // Default folder path from environment variable or provided path
    const projectRoot = process.env.PROJECT_ROOT_PATH;
    if (!projectRoot && !folderPath) {
      return res.status(500).json({
        success: false,
        error: 'PROJECT_ROOT_PATH not set in .env file and no folderPath provided'
      });
    }

    // Determine the base path (either from UI override or .env)
    const basePath = folderPath || projectRoot!;
    const routerModuleName = routerName || process.env.ROUTER_MODULE_NAME || 'assist-router';

    // Validate paths before creating any files
    const validation = await validatePaths(basePath, routerModuleName);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Validation failed'
      });
    }

    const targetPath = path.join(basePath, 'src', 'modules', 'feature', moduleId);

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
    await updateScreenRoutes(moduleId, moduleName, targetSection, routerName, basePath);

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
async function updateScreenRoutes(
  moduleId: string,
  moduleName: string,
  targetSection?: string,
  routerName?: string,
  basePath?: string
): Promise<void> {
  const projectRoot = basePath || process.env.PROJECT_ROOT_PATH;
  if (!projectRoot) {
    console.log('⚠️  PROJECT_ROOT_PATH not set, skipping route update');
    return;
  }

  const routerModuleName = routerName || process.env.ROUTER_MODULE_NAME || 'assist-router';
  const screenRoutesPath = path.join(projectRoot, 'src', 'modules', 'core', routerModuleName, 'screenRoutes.tsx');

  console.log(`🧭 Using router module: ${routerModuleName}`);
  console.log(`📄 Screen routes path: ${screenRoutesPath}`);

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
    const fileContent = `// template/modules/core/${routerModuleName}/screenRoutes.tsx
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