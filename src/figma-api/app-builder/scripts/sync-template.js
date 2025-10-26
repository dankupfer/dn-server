#!/usr/bin/env node

/**
 * Sync Template Script
 * 
 * Copies the React Native template from dn-starter to app-builder.
 * This keeps the template used for code generation in sync with the source.
 * 
 * Usage: npm run sync-template
 */

const fs = require('fs');
const path = require('path');

// Paths
const SOURCE_DIR = '/Users/dankupfer/Documents/dev/dn-starter/template';
const TARGET_DIR = path.join(__dirname, '../template');

// Directories and files to exclude
const EXCLUDE = [
    'node_modules',
    '.git',
    '.expo',
    '.expo-shared',
    'dist',
    'build',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock'
];

/**
 * Check if path should be excluded
 */
function shouldExclude(itemPath) {
    const basename = path.basename(itemPath);
    return EXCLUDE.includes(basename);
}

/**
 * Recursively copy directory
 */
function copyDirectory(source, target) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    // Read source directory
    const items = fs.readdirSync(source);

    items.forEach(item => {
        const sourcePath = path.join(source, item);
        const targetPath = path.join(target, item);

        // Skip excluded items
        if (shouldExclude(sourcePath)) {
            console.log(`⏭️  Skipping: ${item}`);
            return;
        }

        const stats = fs.statSync(sourcePath);

        if (stats.isDirectory()) {
            console.log(`📁 Copying directory: ${item}`);
            copyDirectory(sourcePath, targetPath);
        } else {
            console.log(`📄 Copying file: ${item}`);
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

/**
 * Main sync function
 */
function syncTemplate() {
    console.log('🔄 Starting template sync...\n');
    console.log(`📂 Source: ${SOURCE_DIR}`);
    console.log(`📂 Target: ${TARGET_DIR}\n`);

    // Validate source exists
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error('❌ Source directory does not exist:', SOURCE_DIR);
        console.error('   Please check the path in sync-template.js');
        process.exit(1);
    }

    // Remove target directory if it exists
    if (fs.existsSync(TARGET_DIR)) {
        console.log('🗑️  Removing existing template directory...');
        fs.rmSync(TARGET_DIR, { recursive: true, force: true });
    }

    // Copy template
    copyDirectory(SOURCE_DIR, TARGET_DIR);

    console.log('\n✅ Template sync complete!');
    console.log(`📦 Template copied to: ${TARGET_DIR}`);
}

// Run sync
try {
    syncTemplate();
} catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
}