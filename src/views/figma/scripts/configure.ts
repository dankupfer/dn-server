// src/views/figma/scripts/configure.ts
// Configure tab - dynamic forms for component configuration

import { fetchJourneyOptions, fetchFormConfig, fetchFieldDefinitions } from './api';
import { showSaveFeedback, sendToPlugin } from './utils';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

let currentSelection: ComponentSelection | null = null;
let fieldDefinitions: any = null;

/**
 * Initialize configure tab
 */
export async function initConfigureTab() {
    console.log('Configure tab initialized');

    // Load field definitions
    try {
        fieldDefinitions = await fetchFieldDefinitions();
        console.log('✅ Field definitions loaded:', fieldDefinitions);
    } catch (error) {
        console.error('❌ Error loading field definitions:', error);
    }

    // Set up clear plugin data button
    const clearButton = document.getElementById('clear-plugin-data');
    if (clearButton) {
        clearButton.onclick = handleClearPluginData;
    }
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

    // Add event listeners for conditional fields
    setupConditionalFieldListeners();
}

/**
 * Check if a field should be disabled based on conditional rules
 */
function shouldDisableField(fieldName: string, dependentFieldValue: any): boolean {
    const fieldDef = fieldDefinitions?.[fieldName];
    if (!fieldDef || !fieldDef.conditionalRules) return false;

    const disableWhen = fieldDef.conditionalRules.disableWhen;
    if (!disableWhen) return false;

    // Check if current value triggers disable rule
    for (const [dependentField, disableValues] of Object.entries(disableWhen)) {
        if (Array.isArray(disableValues) && disableValues.includes(dependentFieldValue)) {
            return true;
        }
    }

    return false;
}

/**
 * Setup event listeners for conditional field rendering
 */
function setupConditionalFieldListeners() {
    const componentName = currentSelection?.componentName;

    // Determine the IDs based on component type
    let sectionHomeCheckboxId: string;
    let sectionHomeInputGroupId: string;
    let sectionTypeSelectId: string;
    let conditionalContainerId: string;
    let sectionHomeOptionSelectId: string;

    if (componentName === 'Journey') {
        // Journey uses generic prop IDs
        sectionHomeCheckboxId = 'config-prop2';  // prop2 maps to sectionHome
        sectionHomeInputGroupId = 'input-group-prop2';
        sectionTypeSelectId = 'config-prop1';    // prop1 maps to section_type
        conditionalContainerId = 'config-prop2-conditional';
        sectionHomeOptionSelectId = 'config-prop2-option';
    } else {
        // ScreenBuilder/Modal use semantic IDs
        sectionHomeCheckboxId = 'config-sectionHome';
        sectionHomeInputGroupId = 'input-group-sectionHome';
        sectionTypeSelectId = 'config-section_type';
        conditionalContainerId = 'config-sectionHome-conditional';
        sectionHomeOptionSelectId = 'config-sectionHome-option';
    }

    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId) as HTMLInputElement;
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId) as HTMLSelectElement;

    if (sectionHomeCheckbox) {
        sectionHomeCheckbox.addEventListener('change', () => {
            toggleSectionHomeOptions(conditionalContainerId, sectionHomeCheckboxId);
            autoSave();
        });
    }

    if (sectionTypeSelect) {
        sectionTypeSelect.addEventListener('change', () => {
            // Update conditional rules (disable/enable sectionHome)
            applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId);

            // Update dropdown options
            updateSectionHomeOptions(sectionTypeSelectId, conditionalContainerId, sectionHomeOptionSelectId);

            autoSave();
        });
    }

    // Initial application of conditional rules
    applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId);

    // Initial render of conditional field
    toggleSectionHomeOptions(conditionalContainerId, sectionHomeCheckboxId);
}

/**
 * Apply conditional rules (disable/hide fields based on other field values)
 */
function applyConditionalRules(sectionTypeSelectId: string, sectionHomeCheckboxId: string, sectionHomeInputGroupId: string) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId) as HTMLSelectElement;
    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId) as HTMLInputElement;
    const sectionHomeInputGroup = document.getElementById(sectionHomeInputGroupId);

    if (!sectionTypeSelect || !sectionHomeCheckbox || !sectionHomeInputGroup) return;

    const sectionTypeValue = sectionTypeSelect.value;
    const shouldDisable = shouldDisableField('sectionHome', sectionTypeValue);

    if (shouldDisable) {
        // Disable and uncheck the checkbox
        sectionHomeCheckbox.disabled = true;
        sectionHomeCheckbox.checked = false;

        // Optionally hide the entire input group
        sectionHomeInputGroup.style.opacity = '0.5';
        sectionHomeInputGroup.style.pointerEvents = 'none';

        // Hide conditional dropdown
        const conditionalContainerId = sectionHomeCheckboxId.replace('config-', 'config-') + '-conditional';
        const conditionalContainer = document.getElementById(conditionalContainerId);
        if (conditionalContainer) {
            conditionalContainer.style.display = 'none';
        }
    } else {
        // Enable the checkbox
        sectionHomeCheckbox.disabled = false;
        sectionHomeInputGroup.style.opacity = '1';
        sectionHomeInputGroup.style.pointerEvents = 'auto';
    }
}

/**
 * Toggle visibility of sectionHome options dropdown
 */
function toggleSectionHomeOptions(conditionalContainerId: string, checkboxId: string) {
    const sectionHomeCheckbox = document.getElementById(checkboxId) as HTMLInputElement;
    const conditionalContainer = document.getElementById(conditionalContainerId);

    if (!conditionalContainer) return;

    // Only show if checkbox is checked AND not disabled
    if (sectionHomeCheckbox && sectionHomeCheckbox.checked && !sectionHomeCheckbox.disabled) {
        conditionalContainer.style.display = 'block';

        // Determine the select ID based on container ID
        const selectId = conditionalContainerId.replace('-conditional', '-option');
        const sectionTypeId = checkboxId.replace('sectionHome', 'section_type').replace('prop2', 'prop1');

        updateSectionHomeOptions(sectionTypeId, conditionalContainerId, selectId);
    } else {
        conditionalContainer.style.display = 'none';
    }
}

/**
 * Update sectionHome options based on section_type
 */
function updateSectionHomeOptions(sectionTypeSelectId: string, conditionalContainerId: string, sectionHomeOptionSelectId: string) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId) as HTMLSelectElement;
    const sectionHomeOptionsSelect = document.getElementById(sectionHomeOptionSelectId) as HTMLSelectElement;

    if (!sectionTypeSelect || !sectionHomeOptionsSelect) return;

    const sectionType = sectionTypeSelect.value;
    const fieldDef = fieldDefinitions?.sectionHome;

    if (!fieldDef || !fieldDef.conditionalOptions) return;

    const options = fieldDef.conditionalOptions[sectionType] || [];

    // Clear existing options
    sectionHomeOptionsSelect.innerHTML = '';

    // Add new options
    options.forEach((option: string) => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        sectionHomeOptionsSelect.appendChild(optionElement);
    });

    // Try to restore saved value if it exists
    if (currentSelection?.properties.sectionHomeOption) {
        sectionHomeOptionsSelect.value = currentSelection.properties.sectionHomeOption;
    }
}

/**
 * Build a form field from field definition
 * @param fieldName - The semantic field name (e.g., 'id', 'section_type', 'sectionHome')
 * @param fieldId - The HTML element ID
 * @param currentValue - Current value from properties
 * @param overrides - Optional overrides for label, description, defaultValue
 */
function buildFieldFromDefinition(
    fieldName: string,
    fieldId: string,
    currentValue: any,
    overrides?: { label?: string, description?: string, defaultValue?: any }
): string {
    // Get field definition or use overrides
    const fieldDef = fieldDefinitions?.[fieldName] || {};
    const label = overrides?.label || fieldDef.label || fieldName;
    const description = overrides?.description || fieldDef.description || '';
    const defaultValue = overrides?.defaultValue || fieldDef.defaultValue || '';
    const value = currentValue !== undefined ? currentValue : defaultValue;

    // Wrap in a container with ID for conditional rule application
    const inputGroupId = `input-group-${fieldName}`;
    let html = `<div class="input-group" id="${inputGroupId}">`;
    html += `<label for="${fieldId}">${label}</label>`;

    if (description) {
        html += `<small class="description">${description}</small>`;
    }

    // Render field based on type
    const fieldType = fieldDef.type || 'text';

    if (fieldType === 'checkbox') {
        html += `<input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''} onchange="autoSave()">`;

        // Special handling for sectionHome - add conditional dropdown container
        if (fieldName === 'sectionHome') {
            const conditionalId = `${fieldId}-conditional`;
            const optionSelectId = `${fieldId}-option`;

            html += `
                <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                    <label for="${optionSelectId}">Home Tab</label>
                    <small class="description">Select which home tab to display</small>
                    <select id="${optionSelectId}" onchange="autoSave()">
                        <!-- Options populated dynamically -->
                    </select>
                </div>
            `;
        }
    } else if (fieldType === 'select' && fieldDef.options) {
        html += `<select id="${fieldId}" onchange="autoSave()">`;
        fieldDef.options.forEach((option: string) => {
            html += `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
        });
        html += `</select>`;
    } else {
        html += `<input type="text" id="${fieldId}" value="${value}" onchange="autoSave()">`;
    }

    html += `</div>`;
    return html;
}

/**
 * Build form HTML based on component type
 */
async function buildFormForComponent(selection: ComponentSelection): Promise<string> {
    const { componentName, properties } = selection;

    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;

    // Check if this is a Journey component (uses dynamic forms from server)
    if (componentName === 'Journey') {
        // Get journey option - default to CoreJourney if not set
        const journeyOption = properties.journeyOption || 'CoreJourney';

        console.log('🎯 Journey component detected');
        console.log('🎯 journeyOption:', journeyOption);
        console.log('🎯 properties:', properties);

        try {
            // 1. Show journey option selector
            html += await buildJourneyOptionSelector(properties, journeyOption);

            // 2. Fetch and show form fields for the selected option
            console.log('🔗 Fetching form config for:', journeyOption);
            const formConfig = await fetchFormConfig(journeyOption);
            console.log('✅ Form config received:', formConfig);

            html += buildDynamicFields(formConfig.fields, properties);

        } catch (error) {
            console.error('❌ Error in Journey form building:', error);
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
 * Build Journey Option selector
 */
async function buildJourneyOptionSelector(properties: Record<string, any>, currentOption: string): Promise<string> {
    try {
        console.log('🔍 Building selector with currentOption:', currentOption);

        const journeyOptions = await fetchJourneyOptions();
        console.log('📋 Available journey options:', journeyOptions);
        console.log('📋 Number of options:', journeyOptions.length);

        let html = `
            <div class="input-group">
                <label for="config-journeyOption">Journey Option</label>
                <small class="description">Select the type of journey to configure</small>
                <select id="config-journeyOption" onchange="handleJourneyOptionChange()">
        `;

        journeyOptions.forEach(option => {
            console.log('  - Adding option:', option.journeyOption, 'Label:', option.label);
            html += `<option value="${option.journeyOption}" ${currentOption === option.journeyOption ? 'selected' : ''}>
                ${option.label}
            </option>`;
        });

        html += `</select></div>`;
        return html;
    } catch (error) {
        console.error('❌ Error building journey option selector:', error);
        return '<p class="error">Error loading journey options</p>';
    }
}

/**
 * Build dynamic form fields from server configuration
 */
function buildDynamicFields(fields: any[], properties: Record<string, any>): string {
    let html = '';

    fields.forEach(field => {
        const value = properties[field.genericKey] || field.defaultValue;

        // Wrap in a container with ID for conditional rule application
        const inputGroupId = `input-group-${field.genericKey}`;
        html += `<div class="input-group" id="${inputGroupId}">`;
        html += `<label for="config-${field.genericKey}">${field.label}</label>`;

        // Add description if it exists
        if (field.description) {
            html += `<small class="description">${field.description}</small>`;
        }

        if (field.type === 'text') {
            html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
        } else if (field.type === 'checkbox') {
            html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? 'checked' : ''} onchange="autoSave()">`;

            // Special handling for sectionHome - add conditional dropdown container
            if (field.name === 'sectionHome') {
                const conditionalId = `config-${field.genericKey}-conditional`;
                const optionSelectId = `config-${field.genericKey}-option`;

                html += `
                    <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                        <label for="${optionSelectId}">Home Tab</label>
                        <small class="description">Select which home tab to display</small>
                        <select id="${optionSelectId}" onchange="autoSave()">
                            <!-- Options populated dynamically -->
                        </select>
                    </div>
                `;
            }
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
 * Build form for App_frame component
 */
function buildAppFrameForm(properties: Record<string, any>): string {
    let html = '';

    // Brand field
    html += `
        <div class="input-group">
            <label for="config-brand">Brand</label>
            <small class="description">Brand theme to use (BrandA, BrandB)</small>
            <select id="config-brand" onchange="autoSave()">
                <option value="BrandA" ${properties.brand === 'BrandA' ? 'selected' : ''}>Brand A</option>
                <option value="BrandB" ${properties.brand === 'BrandB' ? 'selected' : ''}>Brand B</option>
            </select>
        </div>
    `;

    // Theme Mode field
    html += `
        <div class="input-group">
            <label for="config-mode">Theme Mode</label>
            <small class="description">Light or dark theme mode</small>
            <select id="config-mode" onchange="autoSave()">
                <option value="light" ${properties.mode === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${properties.mode === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
        </div>
    `;

    // API Base URL field
    html += `
        <div class="input-group">
            <label for="config-apiBase">API Base URL</label>
            <small class="description">Base URL for API endpoints</small>
            <input type="text" id="config-apiBase" value="${properties.apiBase || 'http://localhost:3001'}" onchange="autoSave()">
        </div>
    `;

    return html;
}

/**
 * Build form for ScreenBuilder_frame component
 */
function buildScreenBuilderForm(properties: Record<string, any>): string {
    let html = '';
    html += buildFieldFromDefinition('id', 'config-id', properties.id, { label: 'Screen ID' });
    html += buildFieldFromDefinition('section_type', 'config-section_type', properties.section_type);
    html += buildFieldFromDefinition('sectionHome', 'config-sectionHome', properties.sectionHome);
    return html;
}

/**
 * Build form for Modal_frame component
 */
function buildModalForm(properties: Record<string, any>): string {
    let html = '';
    html += buildFieldFromDefinition('id', 'config-id', properties.id, { label: 'Modal ID' });
    html += buildFieldFromDefinition('section_type', 'config-section_type', properties.section_type);
    html += buildFieldFromDefinition('sectionHome', 'config-sectionHome', properties.sectionHome);
    return html;
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
        updatedProperties.journeyOption = (document.getElementById('config-journeyOption') as HTMLSelectElement)?.value;

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

        // Save sectionHomeOption if sectionHome is checked (prop2 = sectionHome)
        const sectionHomeCheckbox = document.getElementById('config-prop2') as HTMLInputElement;
        if (sectionHomeCheckbox?.checked && !sectionHomeCheckbox.disabled) {
            const sectionHomeOptionSelect = document.getElementById('config-prop2-option') as HTMLSelectElement;
            if (sectionHomeOptionSelect) {
                updatedProperties.sectionHomeOption = sectionHomeOptionSelect.value;
            }
        }
    } else if (componentName === 'ScreenBuilder_frame' || componentName === 'Modal_frame') {
        updatedProperties.id = (document.getElementById('config-id') as HTMLInputElement)?.value;
        updatedProperties.section_type = (document.getElementById('config-section_type') as HTMLSelectElement)?.value;
        updatedProperties.sectionHome = (document.getElementById('config-sectionHome') as HTMLInputElement)?.checked;

        // Save sectionHomeOption if sectionHome is checked
        const sectionHomeCheckbox = document.getElementById('config-sectionHome') as HTMLInputElement;
        if (sectionHomeCheckbox?.checked && !sectionHomeCheckbox.disabled) {
            const sectionHomeOptionSelect = document.getElementById('config-sectionHome-option') as HTMLSelectElement;
            if (sectionHomeOptionSelect) {
                updatedProperties.sectionHomeOption = sectionHomeOptionSelect.value;
            }
        }
    }

    console.log('💾 Saving properties:', updatedProperties);

    // Send to plugin
    sendToPlugin({
        type: 'update-properties',
        properties: updatedProperties
    });

    // Show brief feedback
    showSaveFeedback();
}

/**
 * Handle Journey Option change - save and rebuild form
 */
export function handleJourneyOptionChange() {
    if (!currentSelection) return;

    // Get the new journeyOption value
    const newOption = (document.getElementById('config-journeyOption') as HTMLSelectElement)?.value;
    console.log('Journey option changed to:', newOption);

    // Update the journeyOption in currentSelection immediately
    currentSelection.properties.journeyOption = newOption;

    // Save to Figma
    autoSave();

    // Rebuild the form to show correct fields
    console.log('Rebuilding form...');
    updateConfigForm();
}

/**
 * Handle clearing all plugin data
 */
function handleClearPluginData() {
    if (!confirm('This will clear all saved configuration data from the selected component(s). Continue?')) {
        return;
    }

    sendToPlugin({ type: 'clear-plugin-data' });
}

// Make functions available globally for inline onclick handlers
(window as any).autoSave = autoSave;
(window as any).handleJourneyOptionChange = handleJourneyOptionChange;
(window as any).handleClearPluginData = handleClearPluginData;