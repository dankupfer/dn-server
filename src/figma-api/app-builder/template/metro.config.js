// Metro configuration for React Native
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Use minimal configuration to avoid "too many open files" errors
config.maxWorkers = 2;

// Add the parent directory to the watchFolders
config.watchFolders = [
  projectRoot
];

// Add the parent directory to the resolver
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules')
];

// Allow resolving files from the src directory
config.resolver.extraNodeModules = {
  '@config': path.resolve(projectRoot, 'src/config'),
  '@modules': path.resolve(projectRoot, 'src/modules'),
  '@components': path.resolve(projectRoot, 'src/components')
};

// Configure module resolution
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['ttf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

module.exports = config;