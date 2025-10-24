// src/views/figma/scripts/configure.ts
// Configure tab - dynamic forms for component configuration

import { fetchComponentTypes, fetchFormConfig } from './api';
import { showSaveFeedback, sendToPlugin } from './utils';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

let currentSelection: ComponentSelection | null = null;

/**
 * Initialize configure tab
 */
export function initConfigureTab() {
    console.log('Configure tab initialized');
}

/**
 * Update selection and rebuild form
 */
export function updateSelection(selection: ComponentSelection | null) {
    currentSelection = selection;
    updateConfigForm();
}

/**
 * Update the config form based on current selection
 */
async function updateConfigForm() {
    const noSelection = document.getElementById('no-selection');
    const configForm = document.getElementById('config-form');

    if (!noSelection || !configForm) return;

    if (!currentSelection || !currentSelection.componentName) {
        noSelection.style.display = 'block';
        configForm.style.display = 'none';
        return;
    }

    noSelection.style.display = 'none';
    configForm.style.display = 'block';

    // Build form based on component type
    const formHTML = await buildFormForComponent(currentSelection);
    configForm.innerHTML = formHTML;
}

/**
 * Build form HTML based on component type - NOW DYNAMIC!
 */
async function buildFormForComponent(selection: ComponentSelection): Promise<string> {
    const { componentName, properties } = selection;

    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;

    // Check if this is a Journey component (uses dynamic forms from server)
    if (componentName === 'Journey') {
        const journeyType = properties.Type || 'AccountCard'; // Default to AccountCard

        try {
            // Fetch form configuration from server
            const formConfig = await fetchFormConfig(journeyType);

            // First, add Journey Type selector (to switch between component types)
            html += await buildJourneyTypeSelector(properties);

            // Then add dynamic fields based on the selected type
            html += buildDynamicFields(formConfig.fields, properties);
        } catch (error) {
            console.error('Error fetching form config:', error);
            html += `<p class="error">Error loading form: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
        }
    }
    // Keep existing hardcoded forms for App_frame and other components
    else if (componentName === 'App_frame') {
        html += buildAppFrameForm(properties);
    }
    else if (componentName === 'ScreenBuilder_frame') {
        html += buildScreenBuilderForm(properties);
    }
    else if (componentName === 'Modal_frame') {
        html += buildModalForm(properties);
    }
    else {
        html += `<p>No configurable properties for this component.</p>`;
    }

    html += `</div>`;
    return html;
}

/**
 * Build Journey Type selector to switch between component types
 */
async function buildJourneyTypeSelector(properties: Record<string, any>): Promise<string> {
    try {
        // Fetch available component types from server
        const componentTypes = await fetchComponentTypes();
        const currentType = properties.Type || 'AccountCard';

        let html = `
            <div class="input-group">
                <label for="config-Type">Component Type</label>
                <small class="description">Select the type of component to configure</small>
                <select id="config-Type" onchange="handleTypeChange()">
        `;

        componentTypes.forEach(type => {
            html += `<option value="${type.componentType}" ${currentType === type.componentType ? 'selected' : ''}>
                ${type.label} (${type.fieldCount} properties)
            </option>`;
        });

        html += `
                </select>
            </div>
        `;

        return html;
    } catch (error) {
        console.error('Error building type selector:', error);
        return '<p class="error">Error loading component types</p>';
    }
}

/**
 * Build dynamic form fields from server configuration
 */
function buildDynamicFields(fields: any[], properties: Record<string, any>): string {
    let html = '';

    fields.forEach(field => {
        const value = properties[field.genericKey] || field.defaultValue;

        html += `<div class="input-group">`;
        html += `<label for="config-${field.genericKey}">${field.label}</label>`;

        if (field.type === 'text') {
            html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
        } else if (field.type === 'checkbox') {
            html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? 'checked' : ''} onchange="autoSave()">`;
        } else if (field.type === 'select' && field.options) {
            html += `<select id="config-${field.genericKey}" onchange="autoSave()">`;
            field.options.forEach((option: string) => {
                html += `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
            });
            html += `</select>`;
        }

        html += `</div>`;
    });

    return html;
}

/**
 * Keep existing hardcoded form builders for other component types
 */
function buildAppFrameForm(properties: Record<string, any>): string {
    return `
        <div class="input-group">
            <label for="config-brand">Brand</label>
            <small class="description">Brand theme to use (BrandA, BrandB)</small>
            <select id="config-brand" onchange="autoSave()">
                <option value="BrandA" ${properties.brand === 'BrandA' ? 'selected' : ''}>Brand A</option>
                <option value="BrandB" ${properties.brand === 'BrandB' ? 'selected' : ''}>Brand B</option>
            </select>
        </div>
        <div class="input-group">
            <label for="config-mode">Theme Mode</label>
            <small class="description">Light or dark theme mode</small>
            <select id="config-mode" onchange="autoSave()">
                <option value="light" ${properties.mode === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${properties.mode === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
        </div>
        <div class="input-group">
            <label for="config-apiBase">API Base URL</label>
            <small class="description">Base URL for API endpoints</small>
            <input type="text" id="config-apiBase" value="${properties.apiBase || 'http://localhost:3001'}" onchange="autoSave()">
        </div>
    `;
}

function buildScreenBuilderForm(properties: Record<string, any>): string {
    return `
        <div class="input-group">
            <label for="config-id">Screen ID</label>
            <small class="description">Unique identifier for this screen</small>
            <input type="text" id="config-id" value="${properties.id || 'screen-1'}" onchange="autoSave()">
        </div>
        <div class="input-group">
            <label for="config-section_type">Section Type</label>
            <small class="description">Where this screen appears: top, bottom, or modal</small>
            <select id="config-section_type" onchange="autoSave()">
                <option value="top" ${properties.section_type === 'top' ? 'selected' : ''}>Top</option>
                <option value="bottom" ${properties.section_type === 'bottom' ? 'selected' : ''}>Bottom</option>
                <option value="modal" ${properties.section_type === 'modal' ? 'selected' : ''}>Modal</option>
            </select>
        </div>
    `;
}

function buildModalForm(properties: Record<string, any>): string {
    return `
        <div class="input-group">
            <label for="config-id">Modal ID</label>
            <small class="description">Unique identifier for this modal</small>
            <input type="text" id="config-id" value="${properties.id || 'modal-1'}" onchange="autoSave()">
        </div>
        <div class="input-group">
            <label for="config-section_type">Section Type</label>
            <small class="description">Where this modal appears: top, bottom, or modal</small>
            <select id="config-section_type" onchange="autoSave()">
                <option value="top" ${properties.section_type === 'top' ? 'selected' : ''}>Top</option>
                <option value="bottom" ${properties.section_type === 'bottom' ? 'selected' : ''}>Bottom</option>
                <option value="modal" ${properties.section_type === 'modal' ? 'selected' : ''}>Modal</option>
            </select>
        </div>
    `;
}

/**
 * Auto-save properties when any input changes
 */
export function autoSave() {
    if (!currentSelection) return;

    const componentName = currentSelection.componentName;
    const updatedProperties: Record<string, any> = {};

    // Collect values based on component type
    if (componentName === 'App_frame') {
        updatedProperties.brand = (document.getElementById('config-brand') as HTMLSelectElement)?.value;
        updatedProperties.mode = (document.getElementById('config-mode') as HTMLSelectElement)?.value;
        updatedProperties.apiBase = (document.getElementById('config-apiBase') as HTMLInputElement)?.value;
    } else if (componentName === 'Journey') {
        updatedProperties.Type = (document.getElementById('config-Type') as HTMLSelectElement)?.value;

        // Collect all prop0-prop9 values dynamically
        for (let i = 0; i < 10; i++) {
            const propKey = `prop${i}`;
            const element = document.getElementById(`config-${propKey}`);

            if (element) {
                if (element instanceof HTMLInputElement) {
                    if (element.type === 'checkbox') {
                        updatedProperties[propKey] = element.checked;
                    } else {
                        updatedProperties[propKey] = element.value;
                    }
                } else if (element instanceof HTMLSelectElement) {
                    updatedProperties[propKey] = element.value;
                }
            }
        }
    } else if (componentName === 'ScreenBuilder_frame' || componentName === 'Modal_frame') {
        updatedProperties.id = (document.getElementById('config-id') as HTMLInputElement)?.value;
        updatedProperties.section_type = (document.getElementById('config-section_type') as HTMLSelectElement)?.value;
    }

    // Send to plugin
    sendToPlugin({
        type: 'update-properties',
        properties: updatedProperties
    });

    // Show brief feedback
    showSaveFeedback();
}

/**
 * Handle Journey Type change - save and rebuild form
 */
export function handleTypeChange() {
    if (!currentSelection) return;

    // Get the new Type value
    const newType = (document.getElementById('config-Type') as HTMLSelectElement)?.value;
    console.log('Type changed to:', newType);

    // Update the Type in currentSelection immediately
    currentSelection.properties.Type = newType;

    // Save to Figma
    autoSave();

    // Rebuild the form to show correct fields
    console.log('Rebuilding form...');
    updateConfigForm();
}

// Make functions available globally for inline onclick handlers
(window as any).autoSave = autoSave;
(window as any).handleTypeChange = handleTypeChange;