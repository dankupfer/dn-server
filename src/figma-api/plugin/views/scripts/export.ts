// src/figma-api/views/scripts/export.ts
// Export tab - handles full app and single component exports

import { sendToPlugin } from './utils';

interface ExportSelection {
    type: 'none' | 'component' | 'item';
    componentName?: string;
}

interface AppFrameConfig {
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
        html = buildFullAppExportForm();
    } else if (currentExportSelection.type === 'component') {
        // Component selected - show single component export form
        html = buildSingleComponentExportForm(currentExportSelection.componentName!);
    } else if (currentExportSelection.type === 'item') {
        // Item selected - show warning
        html = buildItemWarning(currentExportSelection.componentName!);
    }

    exportContainer.innerHTML = html;
}

/**
 * Build full app export form (when nothing is selected)
 */
function buildFullAppExportForm(): string {
    // Check if App_frame exists
    if (!appFrameConfig) {
        return `
            <div class="section">
                <h2>Export Options</h2>
                
                <div class="warning-box">
                    <strong>⚠️ App_frame Required</strong>
                    <p>Please create an App_frame component on your canvas before exporting.</p>
                    <p>The App_frame is required to configure your application settings.</p>
                </div>
            </div>
        `;
    }

    // Check if appName is configured
    if (!appFrameConfig.appName || appFrameConfig.appName.trim() === '') {
        return `
            <div class="section">
                <h2>Export Options</h2>
                
                <div class="warning-box">
                    <strong>⚠️ App Name Required</strong>
                    <p>Please configure the App Name in your App_frame component first.</p>
                    <ol style="margin: 8px 0 0 20px; padding: 0;">
                        <li>Select the App_frame on your canvas</li>
                        <li>Go to the Configure tab</li>
                        <li>Enter an App Name</li>
                        <li>Return here to export</li>
                    </ol>
                </div>
            </div>
        `;
    }

    const hasExported = appFrameConfig.exportState?.hasExported || false;
    const exportedName = appFrameConfig.exportState?.exportedWithAppName;
    const nameChanged = hasExported && exportedName !== appFrameConfig.appName;
    const prototypeUrl = appFrameConfig.exportState?.prototypeUrl;

    return `
        <div class="section">
            <h2>Export Options</h2>
            <p class="description">Choose how to export your app configuration</p>
            
            <div class="component-info">
                <h3>Project Configuration</h3>
                <table class="info-table">
                    <tr>
                        <td><strong>App Name:</strong></td>
                        <td>${appFrameConfig.appName}</td>
                    </tr>
                    ${hasExported ? `
                    <tr>
                        <td><strong>Last Exported:</strong></td>
                        <td>${new Date(appFrameConfig.exportState!.lastExportDate).toLocaleString()}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            ${nameChanged ? `
            <div class="warning-box" style="margin-bottom: 16px;">
                <strong>⚠️ App Name Changed</strong>
                <p>App name was changed from "${exportedName}" to "${appFrameConfig.appName}".</p>
                <p>Re-exporting will create a new project folder.</p>
            </div>
            ` : ''}

            <!-- Option 1: Export Web -->
            <div class="export-option">
                <h3>🌐 Web Prototype</h3>
                <p class="description">Generate a shareable web link with iPhone frame viewer</p>
                
                ${prototypeUrl ? `
                <div class="info-box" style="margin: 12px 0;">
                    <strong>Current Prototype:</strong>
                    <a href="${prototypeUrl}" target="_blank" style="display: block; margin-top: 4px; font-size: 11px; word-break: break-all;">${prototypeUrl}</a>
                </div>
                ` : ''}
                
                <div class="button-group">
                    <button class="primary" onclick="handleWebExport()">
                        ${prototypeUrl ? '🔄 Update' : '🚀 Generate'} Web Link
                    </button>
                </div>
                
                <!-- Polling status (hidden by default) -->
                <div id="web-export-status" style="display: none; margin-top: 12px;">
                    <div class="info-box">
                        <strong>Building prototype...</strong>
                        <div style="margin: 8px 0;">
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div id="web-progress-bar" style="background: #667eea; height: 100%; width: 0%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <p id="web-status-text" style="margin: 4px 0 0 0; font-size: 12px;">Starting build...</p>
                    </div>
                </div>
            </div>

            <!-- Option 2: Simulator Live -->
            <div class="export-option">
                <h3>📱 Simulator Live</h3>
                <p class="description">Create React Native project with full source code</p>
                
                <div class="input-group">
                    <label for="simulator-path">Export Path</label>
                    <input 
                        type="text" 
                        id="simulator-path" 
                        placeholder="/Users/username/projects"
                        value="${appFrameConfig.exportState?.exportPath || '/Users/dankupfer/Documents/dev/dn-server'}"
                    >
                    <small class="description">Project will be created at: {path}/${appFrameConfig.appName}/</small>
                </div>
                
                <div class="button-group">
                    <button class="primary" onclick="handleSimulatorExport()">
                        ${hasExported && !nameChanged ? '🔄 Re-export' : '📦 Export'} Project
                    </button>
                </div>
            </div>

            <!-- Option 3: Download Zip (Coming Soon) -->
            <div class="export-option" style="opacity: 0.6;">
                <h3>📦 Download Zip</h3>
                <p class="description">Download complete project as zip file (Coming Soon)</p>
                
                <div class="button-group">
                    <button class="secondary" disabled>
                        🚧 Coming Soon
                    </button>
                </div>
            </div>

            <div class="info-box" style="margin-top: 20px;">
                <strong>What gets exported:</strong>
                <ul>
                    <li>App configuration (from App_frame)</li>
                    <li>All Journey components with their properties</li>
                    <li>All ScreenBuilder frames with their properties</li>
                    <li>Complete routing and navigation setup</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Build single component export form
 */
function buildSingleComponentExportForm(componentName: string): string {
    // Get component info from current selection
    const componentId = currentSelection?.properties?.id ||
        currentSelection?.properties?.prop0 ||
        'unknown';
    const sectionHome = currentSelection?.properties?.sectionHome || false;
    const sectionHomeOption = currentSelection?.properties?.sectionHomeOption || 'N/A';
    const sectionType = currentSelection?.properties?.section_type ||
        currentSelection?.properties?.prop1 ||
        'N/A';

    // Check if component export is allowed
    const hasExported = appFrameConfig?.exportState?.hasExported || false;
    const exportedName = appFrameConfig?.exportState?.exportedWithAppName;
    const currentName = appFrameConfig?.appName;
    const nameChanged = hasExported && exportedName !== currentName;
    const canExport = hasExported && !nameChanged && appFrameConfig;

    return `
        <div class="section">
            <h2>Export Single Component</h2>
            <p class="description">Export the selected ${componentName} to your React Native app.</p>
            
            <div class="component-info">
                <h3>Component Details</h3>
                <table class="info-table">
                    <tr>
                        <td><strong>Component:</strong></td>
                        <td>${componentName}</td>
                    </tr>
                    <tr>
                        <td><strong>ID:</strong></td>
                        <td>${componentId}</td>
                    </tr>
                    <tr>
                        <td><strong>Section Type:</strong></td>
                        <td>${sectionType}</td>
                    </tr>
                    <tr>
                        <td><strong>Is Home Tab:</strong></td>
                        <td>${sectionHome ? 'Yes' : 'No'}</td>
                    </tr>
                    ${sectionHome ? `
                    <tr>
                        <td><strong>Home Tab:</strong></td>
                        <td>${sectionHomeOption}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            ${!canExport ? `
            <div class="warning-box">
                <strong>⚠️ ${!hasExported ? 'Full App Export Required' : 'App Name Changed'}</strong>
                <p>${!hasExported
                ? 'Please export the full app configuration before exporting individual components.'
                : `App name changed from "${exportedName}" to "${currentName}". Please re-export the full app first.`
            }</p>
            </div>
            ` : `
            <div class="info-box" style="margin-top: 16px;">
                <strong>Export Target:</strong>
                <p style="margin: 4px 0 0 0; font-size: 11px;">${appFrameConfig!.exportState!.exportPath}/${currentName}/fullAppConfig.json</p>
            </div>
            `}
            
            <div class="button-group">
                <button class="primary" onclick="handleSingleComponentExport()" ${!canExport ? 'disabled' : ''}>
                    Export Component to App
                </button>
            </div>
            
            ${canExport ? `
            <div class="info-box">
                <strong>What happens:</strong>
                <ul>
                    <li>Component configuration will be sent to bridge server</li>
                    <li>Server will generate React Native files</li>
                    <li>Files will be added to your app project</li>
                    <li>Navigation will be automatically configured</li>
                </ul>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Build warning message for item selection
 */
function buildItemWarning(componentName: string): string {
    return `
        <div class="section">
            <h2>Export Not Available</h2>
            
            <div class="warning-box">
                <strong>⚠️ Cannot export individual items</strong>
                <p>You have selected a ${componentName} item component.</p>
                <p>To export:</p>
                <ul>
                    <li><strong>Deselect all</strong> to export the full app configuration</li>
                    <li><strong>Select a Journey or ScreenBuilder frame</strong> to export that component</li>
                </ul>
            </div>
        </div>
    `;
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

        // Wait 2 seconds then show the URL
        setTimeout(() => {
            const statusDiv = document.getElementById('web-export-status');
            if (statusDiv) {
                statusDiv.style.display = 'none';
            }

            // Update App_frame config with new URL
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
(window as any).handleWebExport = handleWebExport;
(window as any).handleSimulatorExport = handleSimulatorExport;
(window as any).handleSingleComponentExport = handleSingleComponentExport;