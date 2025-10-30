// src/figma-api/app-builder/services/bundlers/esbuildBundler.ts

import fs from 'fs-extra';
import path from 'path';
import * as esbuild from 'esbuild';
import * as jobQueue from '../jobQueue.service';

/**
 * Bundle with esbuild (faster, development-friendly)
 */
export async function bundleWithEsbuild(
    jobId: string,
    tempPath: string,
    buildPath: string
): Promise<void> {
    jobQueue.updateProgress(jobId, 50, 'Bundling with esbuild (5-10s)...');

    const bundlePath = path.join(buildPath, 'bundle');
    await fs.ensureDir(bundlePath);

    // Path to template's node_modules
    const templateNodeModules = path.join(__dirname, '../../template/node_modules');

    try {
        // Find entry point (index.js or index.tsx)
        const entryPoint = await findEntryPoint(tempPath);

        await esbuild.build({
            entryPoints: [entryPoint],
            bundle: true,
            outfile: path.join(bundlePath, 'index.js'),
            format: 'cjs',
            platform: 'browser',
            target: 'es2020',
            jsx: 'automatic',
            jsxDev: true,
            sourcemap: true,
            treeShaking: false,
            loader: {
                '.js': 'jsx',
                '.jsx': 'jsx',
                '.ts': 'tsx',
                '.tsx': 'tsx',
                '.json': 'json',
                '.ttf': 'file',
                '.otf': 'file',
                '.woff': 'file',
                '.woff2': 'file',
                '.png': 'file',
                '.jpg': 'file',
                '.svg': 'file'
            },
            define: {
                'process.env.NODE_ENV': '"development"',
                'global': 'window',
                '__DEV__': 'false'
            },
            nodePaths: [templateNodeModules],
            alias: {
                'react-native': 'react-native-web/dist/index.js'
            },
            external: [],
            plugins: [
                {
                    name: 'mock-native-modules',
                    setup(build) {
                        build.onResolve({ filter: /^react-native$/ }, args => {
                            if (args.importer.includes('react-native-svg')) {
                                return { path: args.path, namespace: 'mock-rn' };
                            }
                            return null;
                        });

                        build.onLoad({ filter: /.*/, namespace: 'mock-rn' }, () => {
                            const rnWebPath = require.resolve('react-native-web', {
                                paths: [templateNodeModules]
                            });

                            return {
                                contents: `
          export const TurboModuleRegistry = {
            get: () => null,
            getEnforcing: () => null
          };
          export * from '${rnWebPath}';
        `,
                                loader: 'js',
                                resolveDir: path.dirname(rnWebPath)
                            };
                        });
                    }
                },
                {
                    name: 'commonjs-interop',
                    setup(build) {
                        build.onLoad({ filter: /node_modules\/react-native-web.*\.js$/ }, async (args) => {
                            const contents = await fs.readFile(args.path, 'utf8');

                            const fixed = contents.replace(
                                /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
                                (match, name, path) => {
                                    if (path.includes('normalize-color')) {
                                        return `import * as ${name}Module from '${path}';\nconst ${name} = ${name}Module.default || ${name}Module;`;
                                    }
                                    return match;
                                }
                            );

                            return { contents: fixed, loader: 'js' };
                        });
                    }
                },
                {
                    name: 'ignore-react-native-internals',
                    setup(build) {
                        build.onResolve({ filter: /react-native\/Libraries/ }, args => {
                            return { path: args.path, namespace: 'ignore-ns' };
                        });

                        build.onResolve({ filter: /@react-native/ }, args => {
                            return { path: args.path, namespace: 'ignore-ns' };
                        });

                        build.onResolve({ filter: /^expo-asset$/ }, args => {
                            return { path: args.path, namespace: 'ignore-ns' };
                        });

                        build.onLoad({ filter: /.*/, namespace: 'ignore-ns' }, () => {
                            return {
                                contents: `
      export const getAssetByID = () => null;
      export class Asset {}
      export const registerRootComponent = () => {};
      export default {};
    `,
                                loader: 'js'
                            };
                        });
                    }
                }
            ]
        });

        // Create simple HTML wrapper
        await fs.writeFile(
            path.join(bundlePath, 'index.html'),
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; overflow: hidden; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="./index.js"></script>
</body>
</html>`
        );

        jobQueue.updateProgress(jobId, 80, 'esbuild bundle complete');

    } catch (error) {
        console.error('esbuild error:', error);
        throw new Error(`esbuild bundling failed: ${error}`);
    }
}

/**
 * Find entry point file
 */
async function findEntryPoint(tempPath: string): Promise<string> {
    const possibleEntries = [
        path.join(tempPath, 'index.js'),
        path.join(tempPath, 'index.tsx'),
        path.join(tempPath, 'App.tsx'),
        path.join(tempPath, 'src/index.tsx')
    ];

    for (const entry of possibleEntries) {
        if (await fs.pathExists(entry)) {
            return entry;
        }
    }

    throw new Error('No entry point found (index.js, index.tsx, or App.tsx)');
}