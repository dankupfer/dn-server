// figma-api/app-builder/services/templateCopy.service.ts

/**
 * TEMPLATE COPY SERVICE
 * 
 * Copies the base React Native template structure to the target directory.
 * Similar to CLI generator but adapted for app-builder workflow.
 */

import * as path from 'path';
import * as fs from 'fs/promises';

export interface TemplateCopyResult {
    success: boolean;
    copiedFiles: string[];
    errors: string[];
}

/**
 * Copy base template structure to target directory
 */
export async function copyBaseTemplate(
    appName: string,
    targetPath: string
): Promise<TemplateCopyResult> {
    const copiedFiles: string[] = [];
    const errors: string[] = [];

    // Get template source path
    const templatePath = path.join(__dirname, '../template');

    try {
        // Verify template exists
        await fs.access(templatePath);
    } catch {
        return {
            success: false,
            copiedFiles: [],
            errors: [`Template not found at: ${templatePath}`]
        };
    }

    try {
        // Ensure target directory exists
        await fs.mkdir(targetPath, { recursive: true });

        // Copy base files
        await copyDirectory(templatePath, targetPath, copiedFiles, errors);

        // Update package.json with app name
        await updatePackageJson(targetPath, appName);
        copiedFiles.push('package.json (updated)');

        return {
            success: errors.length === 0,
            copiedFiles,
            errors
        };

    } catch (error) {
        errors.push(`Template copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            copiedFiles,
            errors
        };
    }
}

/**
 * Recursively copy directory contents
 */
async function copyDirectory(
    source: string,
    target: string,
    copiedFiles: string[],
    errors: string[]
): Promise<void> {
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        // Skip certain files/folders
        if (shouldSkip(entry.name)) {
            continue;
        }

        try {
            if (entry.isDirectory()) {
                // Create directory and recurse
                await fs.mkdir(targetPath, { recursive: true });
                await copyDirectory(sourcePath, targetPath, copiedFiles, errors);
            } else {
                // Copy file
                await fs.copyFile(sourcePath, targetPath);
                const relativePath = path.relative(target, targetPath);
                copiedFiles.push(relativePath);
            }
        } catch (error) {
            errors.push(`Failed to copy ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

/**
 * Determine if file/folder should be skipped
 */
function shouldSkip(name: string): boolean {
    const skipList = [
        'node_modules',
        '.expo',
        '.expo-shared',
        'dist',
        'build',
        '.DS_Store',
        '.git',
        '.tgz',
        'package-lock.json',
        'yarn.lock'
    ];

    return skipList.includes(name) || name.endsWith('.tgz');
}

/**
 * Update package.json with app name
 */
async function updatePackageJson(targetPath: string, appName: string): Promise<void> {
    const packageJsonPath = path.join(targetPath, 'package.json');

    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);

        // Update name
        packageJson.name = appName;

        // Write back
        await fs.writeFile(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2),
            'utf-8'
        );
    } catch (error) {
        throw new Error(`Failed to update package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate template copy summary
 */
export function generateTemplateCopySummary(result: TemplateCopyResult): string {
    let report = `  Copied ${result.copiedFiles.length} files\n`;

    if (result.errors.length > 0) {
        report += `  Errors: ${result.errors.length}\n`;
    }

    return report;
}