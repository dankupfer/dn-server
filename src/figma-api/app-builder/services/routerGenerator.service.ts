// figma-api/app-builder/services/routerGenerator.service.ts

/**
 * ROUTER GENERATOR SERVICE
 * 
 * Generates router files for the app:
 * - carouselRoutes.tsx (main carousel sections)
 * - bottomNavRoutes.tsx (tabs and modals)
 * - childRoutes.tsx (child screens)
 * 
 * Each file contains imports and route definitions for navigation
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import {
    CategorisedComponents,
    RouteComponent,
    RouterConfig,
    RouterImport,
    GeneratedRouter,
    RouterGenerationResult
} from '../types/appBuilder.types';
import { generateImportPath } from './moduleGenerator.service';

/**
 * Main router generation function
 * Generates all three router files
 */
export async function generateRouters(
    appId: string,
    categorised: CategorisedComponents,
    basePath: string
): Promise<RouterGenerationResult> {
    const routers: GeneratedRouter[] = [];
    const errors: string[] = [];

    // Router output path
    const routerBasePath = path.join(basePath, 'src', 'modules', 'core', 'figma-router');

    try {
        await ensureDirectoryExists(routerBasePath);
    } catch (error) {
        errors.push(`Failed to create router directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            routers: [],
            errors
        };
    }

    // Generate carousel routes
    try {
        const carouselRouter = await generateCarouselRouter(
            appId,
            categorised.carouselRoutes,
            routerBasePath
        );
        routers.push(carouselRouter);
        if (!carouselRouter.success && carouselRouter.error) {
            errors.push(`Carousel router: ${carouselRouter.error}`);
        }
    } catch (error) {
        errors.push(`Failed to generate carousel router: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate bottom nav routes
    try {
        const bottomNavRouter = await generateBottomNavRouter(
            appId,
            categorised.bottomNavRoutes,  // Single combined array
            routerBasePath
        );
        routers.push(bottomNavRouter);
        if (!bottomNavRouter.success && bottomNavRouter.error) {
            errors.push(`Bottom nav router: ${bottomNavRouter.error}`);
        }
    } catch (error) {
        errors.push(`Failed to generate bottom nav router: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate child routes
    try {
        const childRouter = await generateChildRouter(
            appId,
            categorised.childRoutes,
            routerBasePath
        );
        routers.push(childRouter);
        if (!childRouter.success && childRouter.error) {
            errors.push(`Child router: ${childRouter.error}`);
        }
    } catch (error) {
        errors.push(`Failed to generate child router: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const allSuccessful = routers.every(r => r.success);

    return {
        success: allSuccessful && errors.length === 0,
        routers,
        errors
    };
}

/**
 * Generate carousel routes file
 */
async function generateCarouselRouter(
    appId: string,
    routes: RouteComponent[],
    outputPath: string
): Promise<GeneratedRouter> {
    const imports = generateImports(appId, routes, outputPath);
    const content = generateCarouselRouterContent(routes, imports);
    const filePath = path.join(outputPath, 'carouselRoutes.tsx');

    const config: RouterConfig = {
        type: 'carousel',
        routes,
        outputPath,
        imports
    };

    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return {
            routerConfig: config,
            filePath,
            content,
            written: true,
            success: true
        };
    } catch (error) {
        return {
            routerConfig: config,
            filePath,
            content,
            written: false,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate bottom nav routes file
 */
async function generateBottomNavRouter(
    appId: string,
    routes: RouteComponent[],
    outputPath: string
): Promise<GeneratedRouter> {
    const imports = generateImports(appId, routes, outputPath);
    const content = generateBottomNavRouterContent(routes, imports);
    const filePath = path.join(outputPath, 'bottomNavRoutes.tsx');

    const config: RouterConfig = {
        type: 'bottomNav',
        routes,
        outputPath,
        imports
    };

    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return {
            routerConfig: config,
            filePath,
            content,
            written: true,
            success: true
        };
    } catch (error) {
        return {
            routerConfig: config,
            filePath,
            content,
            written: false,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate child routes file
 */
async function generateChildRouter(
    appId: string,
    routes: RouteComponent[],
    outputPath: string
): Promise<GeneratedRouter> {
    const imports = generateImports(appId, routes, outputPath);
    const content = generateChildRouterContent(routes, imports);
    const filePath = path.join(outputPath, 'childRoutes.tsx');

    const config: RouterConfig = {
        type: 'child',
        routes,
        outputPath,
        imports
    };

    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return {
            routerConfig: config,
            filePath,
            content,
            written: true,
            success: true
        };
    } catch (error) {
        return {
            routerConfig: config,
            filePath,
            content,
            written: false,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate imports for router file
 */
function generateImports(
    appId: string,
    routes: RouteComponent[],
    routerPath: string
): RouterImport[] {
    return routes.map(route => {
        const componentName = generateComponentName(route.component.id);
        const fileName = generateFileName(route.component.id);
        const importPath = generateImportPath(appId, fileName, routerPath);

        return {
            componentName,
            importPath
        };
    });
}

/**
 * Generate carousel router file content
 */
function generateCarouselRouterContent(
    routes: RouteComponent[],
    imports: RouterImport[]
): string {
    let content = `// Generated by App Builder
import React from 'react';
`;

    // Add imports
    if (imports.length > 0) {
        imports.forEach(imp => {
            content += `import ${imp.componentName} from '${imp.importPath}';\n`;
        });
    }

    content += `
export interface CarouselRoute {
  id: string;
  name: string;
  title?: string;
  component: React.ComponentType<{ screenWidth: number }>;
}

export const carouselRoutes: CarouselRoute[] = [
`;

    // Add routes
    if (routes.length > 0) {
        routes.forEach((route, index) => {
            const componentName = imports[index].componentName;
            const comma = index < routes.length - 1 ? ',' : '';
            const titleProp = route.title ? `, title: '${route.title}'` : '';
            content += `  { id: '${route.routeId}', name: '${route.name}'${titleProp}, component: ${componentName} }${comma}\n`;
        });
    } else {
        content += `  // No carousel routes defined\n`;
    }

    content += `];\n`;

    return content;
}

/**
 * Generate bottom nav router file content
 */
function generateBottomNavRouterContent(
    routes: RouteComponent[],
    imports: RouterImport[]
): string {
    let content = `// Generated by App Builder
import React from 'react';
`;

    // Add imports
    if (imports.length > 0) {
        imports.forEach(imp => {
            content += `import ${imp.componentName} from '${imp.importPath}';\n`;
        });
    }

    content += `
export interface BottomNavRoute {
  id: string;
  name: string;
  title?: string;
  type: 'tab' | 'modal';
  component?: React.ComponentType<{ screenWidth: number }>; // Made optional for 'home'
}

export const bottomNavRoutes: BottomNavRoute[] = [
  { id: 'home', name: 'Home', title: 'Home', type: 'tab' }, // No component - shows carousel
`;

    // Add all routes in order (respecting the array order from Figma)
    routes.forEach((route, index) => {
        const componentName = imports[index].componentName;
        const comma = index < routes.length - 1 ? ',' : '';
        const titleProp = route.title ? `, title: '${route.title}'` : '';
        content += `  { id: '${route.routeId}', name: '${route.name}'${titleProp}, type: '${route.type}', component: ${componentName} }${comma}\n`;
    });

    content += `];\n`;

    return content;
}

/**
 * Generate child router file content
 */
function generateChildRouterContent(
    routes: RouteComponent[],
    imports: RouterImport[]
): string {
    let content = `// Generated by App Builder
import React from 'react';
`;

    // Add imports
    if (imports.length > 0) {
        imports.forEach(imp => {
            content += `import ${imp.componentName} from '${imp.importPath}';\n`;
        });
    }

    content += `
export interface ChildRoute {
  id: string;
  name: string;
  title?: string;
  type: 'slide' | 'modal' | 'full';
  component: React.ComponentType<{ screenWidth: number }>;
}

export const childRoutes: ChildRoute[] = [
`;

    // Add routes
    if (routes.length > 0) {
        routes.forEach((route, index) => {
            const componentName = imports[index].componentName;
            const type = route.type || 'slide'; // Default to 'slide'
            const comma = index < routes.length - 1 ? ',' : '';
            const titleProp = route.title ? `, title: '${route.title}'` : '';
            content += `  { id: '${route.routeId}', name: '${route.name}'${titleProp}, type: '${type}', component: ${componentName} }${comma}\n`;
        });
    } else {
        content += `  // No child routes defined\n`;
    }

    content += `];\n`;

    return content;
}

/**
 * Generate component name in PascalCase
 */
function generateComponentName(id: string): string {
    return id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Generate file name in kebab-case
 */
function generateFileName(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Generate router summary report
 */
export function generateRouterSummary(result: RouterGenerationResult): string {
    let report = `\n=== ROUTER GENERATION REPORT ===\n`;
    report += `Total routers: ${result.routers.length}\n`;
    report += `Success: ${result.success ? 'Yes' : 'No'}\n\n`;

    if (result.routers.length > 0) {
        report += `Generated routers:\n`;
        result.routers.forEach(router => {
            const status = router.success ? '✓' : '✗';
            const type = router.routerConfig.type;
            const routeCount = router.routerConfig.routes.length;
            report += `  ${status} ${type}Routes.tsx (${routeCount} routes)\n`;
            if (!router.success && router.error) {
                report += `      Error: ${router.error}\n`;
            }
        });
        report += `\n`;
    }

    if (result.errors.length > 0) {
        report += `Errors (${result.errors.length}):\n`;
        result.errors.forEach(error => {
            report += `  ✗ ${error}\n`;
        });
        report += `\n`;
    }

    report += `=== END REPORT ===\n`;

    return report;
}

/**
 * Validate generated router files
 */
export async function validateGeneratedRouters(
    routers: GeneratedRouter[]
): Promise<string[]> {
    const errors: string[] = [];

    for (const router of routers) {
        if (!router.written) {
            errors.push(`Router '${router.routerConfig.type}Routes.tsx' was not written to disk`);
            continue;
        }

        // Verify file exists on disk
        try {
            await fs.access(router.filePath);
        } catch {
            errors.push(`Router file not found: ${router.filePath}`);
        }

        // Check that content is not empty
        if (!router.content || router.content.trim().length === 0) {
            errors.push(`Router '${router.routerConfig.type}Routes.tsx' has empty content`);
        }

        // Validate that imports match routes
        const expectedImports = router.routerConfig.imports.length;
        const actualRoutes = router.routerConfig.routes.length;
        if (expectedImports !== actualRoutes) {
            errors.push(
                `Router '${router.routerConfig.type}Routes.tsx': Import/route mismatch (${expectedImports} imports, ${actualRoutes} routes)`
            );
        }
    }

    return errors;
}

/**
 * Get router file paths for testing/validation
 */
export function getRouterFilePaths(basePath: string): {
    carousel: string;
    bottomNav: string;
    child: string;
} {
    const routerBasePath = path.join(basePath, 'src', 'modules', 'core', 'assist-router');

    return {
        carousel: path.join(routerBasePath, 'carouselRoutes.tsx'),
        bottomNav: path.join(routerBasePath, 'bottomNavRoutes.tsx'),
        child: path.join(routerBasePath, 'childRoutes.tsx')
    };
}