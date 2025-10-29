// src/figma-api/views/scripts/exportForms.ts
// HTML templates for export forms

import type { AppFrameConfig } from './export';

/**
 * Build full app export form (when nothing is selected)
 */
export function buildFullAppExportForm(appFrameConfig: AppFrameConfig | null): string {
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
<div class="export-option" style="border: 2px solid #667eea; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #f8f9ff;">
    <h3 style="margin-top: 0; color: #667eea;">🌐 Web Prototype</h3>
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

                <!-- Public Access Options -->
                <div class="input-group" style="margin-top: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input 
                            type="checkbox" 
                            id="web-public-access" 
                            onchange="togglePublicAccessFields()"
                            style="width: auto; cursor: pointer;"
                        >
                        <span>Enable public access restrictions</span>
                    </label>
                    <small class="description">Require password and set expiration for this prototype</small>
                </div>

                <!-- Public access fields (hidden by default) -->
                <div id="web-public-fields" style="display: none; margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                    <div class="input-group">
                        <label for="web-password">Password</label>
                        <div style="display: flex; gap: 8px;">
                            <input 
                                type="text" 
                                id="web-password" 
                                placeholder="Enter password"
                                value="secure-${Math.random().toString(36).substring(2, 10)}"
                            >
                            <button 
                                type="button" 
                                class="secondary" 
                                onclick="refreshPassword()"
                                style="padding: 8px 16px; white-space: nowrap;"
                            >
                                🔄 New
                            </button>
                        </div>
                        <small class="description">Users will need this password to view the prototype</small>
                    </div>
                    
                    <div class="input-group">
                        <label for="web-expiry">Expires in</label>
                        <select id="web-expiry" onchange="handleExpiryChange()">
                            <option value="1">1 day</option>
                            <option value="7" selected>1 week</option>
                            <option value="30">1 month</option>
                            <option value="custom">Custom date...</option>
                        </select>
                        <small class="description">Prototype will be automatically disabled after this period</small>
                    </div>
                    
                    <!-- Custom date picker (shown when custom selected) -->
                    <div id="custom-expiry-date" style="display: none; margin-top: 8px;">
                        <div class="input-group">
                            <label for="web-custom-date">Custom expiry date</label>
                            <input 
                                type="date" 
                                id="web-custom-date"
                                min="${new Date().toISOString().split('T')[0]}"
                            >
                        </div>
                    </div>
                </div>
            </div>

<!-- Option 2: Simulator Live -->
<div class="export-option" style="border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #f0fdf4;">
    <h3 style="margin-top: 0; color: #22c55e;">📱 Simulator Live</h3>
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
<div class="export-option" style="border: 2px solid #94a3b8; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #f8fafc; opacity: 0.7;">
    <h3 style="margin-top: 0; color: #64748b;">📦 Download Zip</h3>
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
export function buildSingleComponentExportForm(
    componentName: string,
    currentSelection: any,
    appFrameConfig: AppFrameConfig | null
): string {
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
export function buildItemWarning(componentName: string): string {
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
 * Toggle public access fields visibility
 */
export function togglePublicAccessFields() {
    const checkbox = document.getElementById('web-public-access') as HTMLInputElement;
    const fieldsDiv = document.getElementById('web-public-fields');

    if (fieldsDiv) {
        fieldsDiv.style.display = checkbox?.checked ? 'block' : 'none';
    }
}

/**
 * Refresh password suggestion
 */
export function refreshPassword() {
    const passwordInput = document.getElementById('web-password') as HTMLInputElement;
    if (passwordInput) {
        const newPassword = `secure-${Math.random().toString(36).substring(2, 10)}`;
        passwordInput.value = newPassword;
    }
}

/**
 * Handle expiry dropdown change
 */
export function handleExpiryChange() {
    const select = document.getElementById('web-expiry') as HTMLSelectElement;
    const customDateDiv = document.getElementById('custom-expiry-date');

    if (customDateDiv) {
        customDateDiv.style.display = select?.value === 'custom' ? 'block' : 'none';
    }
}