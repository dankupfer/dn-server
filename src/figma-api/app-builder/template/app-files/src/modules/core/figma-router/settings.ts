// src/modules/core/figma-router/settings.ts
import { SettingsConfig } from '@dankupfer/dn-components';

export const settingsConfig: SettingsConfig = {
    debug: {
        name: 'Debug Options',
        contexts: ['all'],
        settings: {
            showDebugZones: {
                name: 'Show Gesture Debug Info',
                description: 'Shows colored overlays for gesture zones when active',
                type: 'boolean', // Now properly typed as literal
                value: false,
                persist: true
            },
            // consoleLogging: {
            //     name: 'Console Logging',
            //     description: 'Enable detailed console logging for debugging',
            //     type: 'boolean',
            //     value: false,
            //     persist: true
            // }
        }
    },
    // developer: {
    //     name: 'Developer Tools',
    //     contexts: ['all'],
    //     settings: {
    //         showBoundingBoxes: {
    //             name: 'Show Component Boundaries',
    //             description: 'Visual debugging for component layouts',
    //             type: 'boolean',
    //             value: false,
    //             persist: false
    //         },
    //         performanceMetrics: {
    //             name: 'Performance Metrics',
    //             description: 'Show FPS and render time information',
    //             type: 'boolean',
    //             value: false,
    //             persist: false
    //         }
    //     }
    // }
};