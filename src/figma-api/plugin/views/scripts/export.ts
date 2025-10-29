// src/figma-api/views/scripts/export.ts
// Export tab - handles full app and single component exports

import { sendToPlugin } from './utils';
import {
    buildFullAppExportForm,
    buildSingleComponentExportForm,
    buildItemWarning,
    togglePublicAccessFields,
    refreshPassword,
    handleExpiryChange
} from './exportForms';

interface ExportSelection {
    type: 'none' | 'component' | 'item';
    componentName?: string;
}

export interface AppFrameConfig {
    appName: string;
    exportState?: {
        exportPath: string;
        hasExported: boolean;
        lastExportDate: string;
        exportedWithAppName: string;
        prototypeUrl?: string;
        jobId?: string;
    };
}

// Module state
let currentExportSelection: ExportSelection = { type: 'none' };
let currentSelection: any = null;
let appFrameConfig: AppFrameConfig | null = null;
let pollingInterval: number | null = null;

/**
 * Initialize export tab
 */
export function initExportTab() {
    console.log('Export tab initialized');

    // Request App_frame config
    sendToPlugin({ type: 'get-app-frame-config' });
}

/**
 * Update App_frame configuration
 */
export function updateAppFrameConfig(config: AppFrameConfig | null) {
    appFrameConfig = config;

    // Only trigger form update if NOT currently polling
    // This prevents the form from refreshing while we're showing build progress
    if (!pollingInterval) {
        updateExportForm();
    }
}

/**
 * Update export selection when Figma selection changes
 */
export function updateExportSelection(selection: any) {
    // Store selection in module state
    currentSelection = selection;

    // App_frame should trigger full app export (same as no selection)
    if (!selection || !selection.componentName || selection.componentName === 'App_frame') {
        currentExportSelection = { type: 'none' };
        console.log('📭 No selection or App_frame - setting type to "none"');
    } else {
        // Determine if it's a frame/journey (component) or an item
        const isComponent = ['Journey', 'ScreenBuilder_frame'].includes(selection.componentName);

        currentExportSelection = {
            type: isComponent ? 'component' : 'item',
            componentName: selection.componentName
        };
    }

    // Always try to update form - updateExportForm will check if container exists
    updateExportForm();
}

/**
 * Update the export form based on current selection
 */
function updateExportForm() {
    const exportContainer = document.getElementById('export-form');
    if (!exportContainer) {
        console.log('⚠️ export-form container not found');
        return;
    }

    let html = '';

    if (currentExportSelection.type === 'none') {
        // No selection - show full app export form
        html = buildFullAppExportForm(appFrameConfig);
    } else if (currentExportSelection.type === 'component') {
        // Component selected - show single component export form
        html = buildSingleComponentExportForm(
            currentExportSelection.componentName!,
            currentSelection,
            appFrameConfig
        );
    } else if (currentExportSelection.type === 'item') {
        // Item selected - show warning
        html = buildItemWarning(currentExportSelection.componentName!);
    }

    exportContainer.innerHTML = html;
}

/**
 * Handle web prototype export
 */
export function handleWebExport() {
    console.log('🌐 Starting web prototype export...');

    // Show polling UI
    const statusDiv = document.getElementById('web-export-status');
    if (statusDiv) {
        statusDiv.style.display = 'block';
    }

    sendToPlugin({
        type: 'export-full-app',
        exportType: 'web',
        exportPath: '' // Not needed for web export
    });
}

/**
 * Handle simulator export
 */
export function handleSimulatorExport() {
    const exportPath = (document.getElementById('simulator-path') as HTMLInputElement)?.value;

    if (!exportPath || exportPath.trim() === '') {
        alert('Please enter an export path');
        return;
    }

    console.log('📱 Exporting to simulator:', exportPath);

    sendToPlugin({
        type: 'export-full-app',
        exportType: 'simulator',
        exportPath
    });
}

/**
 * Handle single component export
 */
export function handleSingleComponentExport() {
    if (!currentSelection || !currentSelection.componentName) {
        alert('No component selected');
        return;
    }

    console.log('🚀 Exporting single component:', currentSelection);

    sendToPlugin({
        type: 'export-single-component',
        componentData: {
            componentName: currentSelection.componentName,
            properties: currentSelection.properties
        }
    });
}

/**
 * Poll for prototype build status
 */
async function pollPrototypeStatus(jobId: string) {
    console.log('🔄 Polling for job:', jobId);

    try {
        const response = await fetch(`http://localhost:3001/api/figma/app-builder/prototype/status/${jobId}`);
        const data = await response.json();

        // Update progress bar
        const progressBar = document.getElementById('web-progress-bar');
        const statusText = document.getElementById('web-status-text');

        if (progressBar) {
            progressBar.style.width = `${data.progress}%`;
        }

        if (statusText) {
            statusText.textContent = data.currentStep || 'Processing...';
        }

        // Check if complete
        if (data.status === 'complete') {
            console.log('✅ Build complete!');

            // Stop polling
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }

            // Show success
            if (statusText) {
                statusText.innerHTML = `<span style="color: #22c55e;">✅ Complete! Build time: ${data.result.buildTime}s</span>`;
            }

            // Wait 2 seconds then refresh the form to show the new URL
            setTimeout(() => {
                // Hide status
                const statusDiv = document.getElementById('web-export-status');
                if (statusDiv) {
                    statusDiv.style.display = 'none';
                }

                // Update App_frame config with new URL
                if (appFrameConfig && appFrameConfig.exportState) {
                    appFrameConfig.exportState.prototypeUrl = data.result.prototypeUrl;
                }

                // Refresh form
                updateExportForm();

                // Show success alert
                alert(`✅ Web prototype ready!\n\n${data.result.prototypeUrl}`);
            }, 2000);

        } else if (data.status === 'error') {
            console.error('❌ Build failed:', data.error);

            // Stop polling
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }

            // Show error
            if (statusText) {
                statusText.innerHTML = `<span style="color: #ef4444;">❌ Error: ${data.error}</span>`;
            }

            alert(`Build failed: ${data.error}`);
        }

    } catch (error) {
        console.error('Polling error:', error);
    }
}

/**
 * Handle full app export complete message from plugin
 */
export function handleFullAppExportComplete(data: any) {
    console.log('Export complete:', data);

    if (data.exportType === 'web') {
        // Start polling for web prototype
        if (data.jobId) {
            console.log('🔄 Starting polling for job:', data.jobId);

            // Show status UI immediately
            const statusDiv = document.getElementById('web-export-status');
            const progressBar = document.getElementById('web-progress-bar');
            const statusText = document.getElementById('web-status-text');

            if (statusDiv) statusDiv.style.display = 'block';
            if (progressBar) progressBar.style.width = '10%';
            if (statusText) statusText.textContent = 'Build started...';

            // Start polling
            startPolling(data.jobId);
        } else {
            alert('⚠️ No job ID returned from server');
        }
    } else if (data.exportType === 'simulator') {
        // Show success for simulator export
        alert(`✅ Simulator export complete!\n\nSaved to: ${data.filePath}\n\nScreens exported: ${data.screenCount}`);
    }
}

/**
 * Start polling for prototype status
 */
function startPolling(jobId: string) {
    // Poll immediately
    pollStatus(jobId);

    // Then poll every 5 seconds
    pollingInterval = window.setInterval(() => {
        pollStatus(jobId);
    }, 5000);
}

/**
 * Poll for status (asks plugin to fetch, plugin sends back result)
 */
function pollStatus(jobId: string) {
    console.log('📊 Polling status for:', jobId);
    sendToPlugin({
        type: 'poll-prototype-status',
        jobId: jobId
    });
}

/**
 * Handle prototype status update from plugin
 */
export function handlePrototypeStatusUpdate(data: any) {
    console.log('📊 Status update:', data);

    const progressBar = document.getElementById('web-progress-bar');
    const statusText = document.getElementById('web-status-text');

    // Update progress bar
    if (progressBar) {
        progressBar.style.width = `${data.progress}%`;
    }

    // Update status text
    if (statusText) {
        statusText.textContent = data.currentStep || 'Processing...';
    }

    // Check if complete
    // Check if complete
    if (data.status === 'complete') {
        console.log('✅ Build complete!');

        // Stop polling
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // CRITICAL: Save prototypeUrl to Figma App_frame config
        sendToPlugin({
            type: 'save-prototype-url',
            prototypeUrl: data.result.prototypeUrl,
            jobId: data.jobId
        });

        // Show success
        if (statusText) {
            statusText.innerHTML = `<span style="color: #22c55e;">✅ Complete! Build time: ${data.result.buildTime}s</span>`;
        }

        // Wait 2 seconds then show the URL
        setTimeout(() => {
            const statusDiv = document.getElementById('web-export-status');
            if (statusDiv) {
                statusDiv.style.display = 'none';
            }

            // Update local appFrameConfig (this was already there but doesn't persist)
            if (appFrameConfig && appFrameConfig.exportState) {
                appFrameConfig.exportState.prototypeUrl = data.result.prototypeUrl;
            }

            // Refresh form to show URL
            updateExportForm();

            // Show success alert with clickable link
            const message = `✅ Web prototype ready!\n\n${data.result.prototypeUrl}\n\nClick OK to open in browser.`;
            if (confirm(message)) {
                window.open(data.result.prototypeUrl, '_blank');
            }
        }, 2000);

    } else if (data.status === 'error') {
        console.error('❌ Build failed:', data.error);

        // Stop polling
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // Show error
        if (statusText) {
            statusText.innerHTML = `<span style="color: #ef4444;">❌ Error: ${data.error}</span>`;
        }

        alert(`Build failed: ${data.error}`);
    }
}

/**
 * Handle single component export complete message from plugin
 */
export function handleSingleComponentExportComplete(data: any) {
    console.log(data);
    alert(`✅ Component exported!\n\nComponent: ${data.componentName}\nConfig updated successfully!`);
}

// Make functions available globally for onclick handlers
(window as any).togglePublicAccessFields = togglePublicAccessFields;
(window as any).refreshPassword = refreshPassword;
(window as any).handleExpiryChange = handleExpiryChange;