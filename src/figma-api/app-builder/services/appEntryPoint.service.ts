// figma-api/app-builder/services/appEntryPoint.service.ts

/**
 * APP ENTRY POINT SERVICE
 * 
 * Configures the App.tsx file based on fullAppConfig.json:
 * - Theme mode (light/dark)
 * - Brand selection
 * - API base URL
 * - Default customer ID
 * 
 * Reads template App.tsx and replaces placeholders with actual config values
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { AppFrame } from '../types/appBuilder.types';

export interface AppEntryPointConfig {
    themeMode: 'light' | 'dark';
    brand: string;
    apiBaseUrl: string;
    defaultCustomerId?: string;
}

export interface AppEntryPointResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

/**
 * Configure App.tsx with values from fullAppConfig
 */
export async function configureAppEntryPoint(
    appFrame: AppFrame,
    appPath: string
): Promise<AppEntryPointResult> {
    try {
        // Read template App.tsx
        const templatePath = path.join(__dirname, '../template/app-files/App.tsx');
        let templateContent = await fs.readFile(templatePath, 'utf-8');

        // Extract configuration from appFrame
        const config: AppEntryPointConfig = {
            themeMode: appFrame.mode || 'light',
            brand: appFrame.brand || 'lloyds',
            apiBaseUrl: appFrame.apiBase || 'http://localhost:3001',
            defaultCustomerId: appFrame.defaultCustomerId
        };
        console.log(appFrame)

        // Replace placeholders in template
        let configuredContent = templateContent;

        // Replace theme mode
        configuredContent = configuredContent.replace(
            /initialThemeMode="[^"]*"/g,
            `initialThemeMode="${config.themeMode}"`
        );

        // Replace brand
        configuredContent = configuredContent.replace(
            /initialBrand="[^"]*"/g,
            `initialBrand="${config.brand}"`
        );

        // Replace API base URL
        configuredContent = configuredContent.replace(
            /apiBaseUrl="[^"]*"/g,
            `apiBaseUrl="${config.apiBaseUrl}"`
        );

        // Add defaultCustomerId if provided
        console.log(5555555555, config.defaultCustomerId)
        console.log(5555555555, config)
        if (config.defaultCustomerId) {
            configuredContent = configuredContent.replace(
                /<CustomerProvider apiBaseUrl="[^"]*">/g,
                `<CustomerProvider apiBaseUrl="${config.apiBaseUrl}" defaultCustomerId="${config.defaultCustomerId}">`
            );
        }

        // Write configured App.tsx to generated app
        const outputPath = path.join(appPath, 'App.tsx');
        await fs.writeFile(outputPath, configuredContent, 'utf-8');

        console.log(`  ✓ Configured App.tsx:`);
        console.log(`    - Theme: ${config.themeMode}`);
        console.log(`    - Brand: ${config.brand}`);
        console.log(`    - API: ${config.apiBaseUrl}`);
        if (config.defaultCustomerId) {
            console.log(`    - Default Customer: ${config.defaultCustomerId}`);
        }

        return {
            success: true,
            filePath: outputPath
        };

    } catch (error) {
        console.error('Failed to configure App.tsx:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Validate App.tsx configuration
 */
export function validateAppEntryPointConfig(appFrame: AppFrame): string[] {
    const errors: string[] = [];

    // Validate theme mode
    if (appFrame.mode && !['light', 'dark'].includes(appFrame.mode)) {
        errors.push(`Invalid theme mode: ${appFrame.mode}. Must be 'light' or 'dark'`);
    }

    // Validate brand (basic check - could be expanded)
    if (appFrame.brand && appFrame.brand.trim().length === 0) {
        errors.push('Brand cannot be empty');
    }

    // Validate API base URL
    if (appFrame.apiBase) {
        try {
            new URL(appFrame.apiBase);
        } catch {
            errors.push(`Invalid API base URL: ${appFrame.apiBase}`);
        }
    }

    return errors;
}

/**
 * Generate summary of App.tsx configuration
 */
export function generateAppEntryPointSummary(appFrame: AppFrame): string {
    const mode = appFrame.mode || 'light';
    const brand = appFrame.brand || 'lloyds';
    const hasCustomerId = !!appFrame.customerId;

    return `Theme: ${mode}, Brand: ${brand}${hasCustomerId ? ', Default Customer: Yes' : ''}`;
}