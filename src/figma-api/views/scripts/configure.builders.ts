// src/figma-api/views/scripts/configure.builders.ts
// Form building functions for component configuration

import { fetchJourneyOptions, fetchFormConfig } from './api';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

/**
 * Build form HTML based on component type
 */
export async function buildFormForComponent(
    selection: ComponentSelection,
    fieldDefinitions: any
): Promise<string> {
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
        html += buildScreenBuilderForm(properties, fieldDefinitions);
    }
    else {
        html += `<p>No configurable properties for this component.</p>`;
    }

    html += `</div>`;
    return html;
}

/**
 * Build a form field from field definition
 * @param fieldName - The semantic field name (e.g., 'id', 'section_type', 'sectionHome')
 * @param fieldId - The HTML element ID
 * @param currentValue - Current value from properties
 * @param overrides - Optional overrides for label, description, defaultValue
 */
export function buildFieldFromDefinition(
    fieldName: string,
    fieldId: string,
    currentValue: any,
    fieldDefinitions: any,
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
 * Build dynamic form fields from server configuration
 */
export function buildDynamicFields(fields: any[], properties: Record<string, any>): string {
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
 * Build Journey Option selector
 */
export async function buildJourneyOptionSelector(
    properties: Record<string, any>,
    currentOption: string
): Promise<string> {
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
 * Build form for App_frame component
 */
export function buildAppFrameForm(properties: Record<string, any>): string {
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
export function buildScreenBuilderForm(
    properties: Record<string, any>,
    fieldDefinitions: any
): string {
    let html = '';
    html += buildFieldFromDefinition('id', 'config-id', properties.id, fieldDefinitions, { label: 'Screen ID' });
    html += buildFieldFromDefinition('section_type', 'config-section_type', properties.section_type, fieldDefinitions);
    html += buildFieldFromDefinition('sectionHome', 'config-sectionHome', properties.sectionHome, fieldDefinitions);
    return html;
}