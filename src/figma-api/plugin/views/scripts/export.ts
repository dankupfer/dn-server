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
    };
}

// Module state
let currentExportSelection: ExportSelection = { type: 'none' };
let currentSelection: any = null;
let appFrameConfig: AppFrameConfig | null = null;

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
    console.log('🎯 App_frame config updated:', config);
    appFrameConfig = config;

    // Trigger form update if on export tab
    updateExportForm();
}

/**
 * Update export selection when Figma selection changes
 */
export function updateExportSelection(selection: any) {
    console.log('🔄 updateExportSelection called with:', selection);

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
        console.log('📦 Selection type:', currentExportSelection.type, 'Component:', selection.componentName);
    }

    // Always try to update form - updateExportForm will check if container exists
    updateExportForm();
}

/**
 * Update the export form based on current selection
 */
function updateExportForm() {
    console.log('🎨 updateExportForm called, selection type:', currentExportSelection.type);

    const exportContainer = document.getElementById('export-form');
    if (!exportContainer) {
        console.log('⚠️ export-form container not found');
        return;
    }

    console.log('✅ export-form container found, building form...');

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
                <h2>Export Full App</h2>
                
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
                <h2>Export Full App</h2>
                
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

    return `
        <div class="section">
            <h2>Export Full App</h2>
            <p class="description">Export complete app configuration from all Journey and ScreenBuilder frames on the canvas.</p>
            
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
                    <tr>
                        <td><strong>Export Path:</strong></td>
                        <td style="font-size: 11px;">${appFrameConfig.exportState!.exportPath}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            ${nameChanged ? `
            <div class="warning-box" style="margin-bottom: 16px;">
                <strong>⚠️ App Name Changed</strong>
                <p>App name was changed from "${exportedName}" to "${appFrameConfig.appName}".</p>
                <p>Re-exporting will create a new project folder. Component exports are disabled until full export completes.</p>
            </div>
            ` : ''}
            
            <div class="input-group">
                <label for="export-path">Export Path</label>
                <small class="description">Directory where project folder will be created</small>
                <input 
                    type="text" 
                    id="export-path" 
                    placeholder="/Users/username/projects"
                    value_to_replace_and_test_later="${appFrameConfig.exportState?.exportPath || '~/Desktop'}"
                    value="${appFrameConfig.exportState?.exportPath || '/Users/dankupfer/Documents/dev/dn-server'}"
                >
                <small class="description">Project will be created at: {path}/${appFrameConfig.appName}/</small>
            </div>
            
            <div class="button-group">
                <button class="primary" onclick="handleFullAppExport()">
                    ${hasExported && !nameChanged ? 'Re-export' : 'Export'} Full App Configii!!
                </button>
            </div>
            
            <div class="info-box">
                <strong>What gets exported:</strong>
                <ul>
                    <li>App configuration (from App_frame)</li>
                    <li>All Journey components with their properties</li>
                    <li>All ScreenBuilder frames with their properties</li>
                    <li>Creates project structure: ${appFrameConfig.appName}/fullAppConfig.json</li>
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
 * Handle full app export
 */
export function handleFullAppExport() {
    const exportPath = (document.getElementById('export-path') as HTMLInputElement)?.value;

    if (!exportPath || exportPath.trim() === '') {
        alert('Please enter an export path');
        return;
    }

    console.log('🚀 Exporting full app to:', exportPath);

    sendToPlugin({
        type: 'export-full-app',
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
 * Handle full app export complete message from plugin
 */
export function handleFullAppExportComplete(data: any) {
    alert(`✅ Full app config exported!\n\nSaved to: ${data.filePath}\n\nScreens exported: ${data.screenCount}`);
}

/**
 * Handle single component export complete message from plugin
 */
export function handleSingleComponentExportComplete(data: any) {
    alert(`✅ Component exported!\n\nModule: ${data.moduleName}\nFiles: ${data.files?.length || 0}`);
}

// Make functions available globally for onclick handlers
(window as any).handleFullAppExport = handleFullAppExport;
(window as any).handleSingleComponentExport = handleSingleComponentExport;