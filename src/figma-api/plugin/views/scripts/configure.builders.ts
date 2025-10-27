// src/figma-api/views/scripts/configure.builders.ts
// SIMPLIFIED: Generic form rendering - no inline event handlers

import { fetchFormConfig } from './api';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

interface FormField {
    key: string;
    type: 'text' | 'checkbox' | 'select';
    label: string;
    description?: string;
    value: any;
    defaultValue: any;
    required: boolean;
    placeholder?: string;
    options?: string[];
    conditionalRules?: any;
    conditionalField?: any;
}

interface FormConfig {
    componentName: string;
    componentLabel: string;
    title: string;
    fields: FormField[];
    hasConfigurations?: boolean;
    configurationField?: {
        key: string;
        type: string;
        label: string;
        description: string;
        options: string[];
        value: string;
    };
}

/**
 * GENERIC form builder - fetches config from server and renders
 * Works for ANY component type
 */
export async function buildFormForComponent(
    selection: ComponentSelection
): Promise<string> {
    const { componentName, properties } = selection;

    // Extract journeyOption - prioritize clean key over suffixed ones
    let journeyOption: string | undefined;

    // First, try the clean key
    if (properties.journeyOption) {
        journeyOption = properties.journeyOption;
    } else {
        // Fallback to suffixed key
        const journeyOptionKey = Object.keys(properties).find(key =>
            key.startsWith('journeyOption#')
        );
        journeyOption = journeyOptionKey ? properties[journeyOptionKey] : undefined;
    }

    try {
        // Fetch form configuration from server
        const formConfig: FormConfig = await fetchFormConfig({
            componentName,
            currentValues: properties,
            selectedConfiguration: journeyOption
        });

        console.log('✅ Form config received:', formConfig);

        // Build HTML
        let html = `<div class="section">`;
        html += `<h2>${formConfig.componentLabel}</h2>`;

        // Render configuration selector if component has configurations
        if (formConfig.hasConfigurations && formConfig.configurationField) {
            html += renderConfigurationSelector(formConfig.configurationField);
        }

        // Render all fields
        formConfig.fields.forEach(field => {
            html += renderField(field);
        });

        html += `</div>`;
        return html;

    } catch (error) {
        console.error('❌ Error building form:', error);
        return `
            <div class="section">
                <h2>${componentName}</h2>
                <p class="error">Error loading form: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        `;
    }
}

/**
 * Render configuration selector (for components like Journey)
 */
function renderConfigurationSelector(configurationField: any): string {
    const { key, label, description, options, value } = configurationField;

    let html = `
        <div class="input-group">
            <label for="config-${key}">${label}</label>
    `;

    if (description) {
        html += `<small class="description">${description}</small>`;
    }

    // KEEP the inline handler for configuration changes - this triggers a form rebuild
    html += `<select id="config-${key}" onchange="handleConfigurationChange()">`;

    options.forEach((option: string) => {
        html += `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
    });

    html += `</select></div>`;

    return html;
}

/**
 * GENERIC field renderer - handles ALL field types
 */
function renderField(field: FormField): string {
    const inputGroupId = `input-group-${field.key}`;

    let html = `<div class="input-group" id="${inputGroupId}">`;
    html += `<label for="config-${field.key}">${field.label}</label>`;

    if (field.description) {
        html += `<small class="description">${field.description}</small>`;
    }

    // Render input based on type - NO INLINE HANDLERS
    switch (field.type) {
        case 'text':
            html += renderTextField(field);
            break;
        case 'checkbox':
            html += renderCheckboxField(field);
            break;
        case 'select':
            html += renderSelectField(field);
            break;
    }

    html += `</div>`;
    return html;
}

/**
 * Render text input field - NO inline handler
 */
function renderTextField(field: FormField): string {
    const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
    return `<input 
        type="text" 
        id="config-${field.key}" 
        value="${field.value || ''}" 
        ${placeholder}
    >`;
}

/**
 * Render checkbox field with optional conditional field - NO inline handler
 */
function renderCheckboxField(field: FormField): string {
    let html = `<input 
        type="checkbox" 
        id="config-${field.key}" 
        ${field.value ? 'checked' : ''}
    >`;

    if (field.conditionalField) {
        const conditionalId = `config-${field.key}-conditional`;
        const optionSelectId = `config-${field.key}-option`;

        // Get saved value if it exists
        const savedValue = field.conditionalField.savedValue || '';

        html += `
            <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                <label for="${optionSelectId}">${field.conditionalField.label}</label>
        `;

        if (field.conditionalField.description) {
            html += `<small class="description">${field.conditionalField.description}</small>`;
        }

        html += `
                <select id="${optionSelectId}" data-saved-value="${savedValue}">
                    <!-- Options populated dynamically by conditional logic -->
                </select>
            </div>
        `;
    }

    return html;
}

/**
 * Render select dropdown field - NO inline handler
 */
function renderSelectField(field: FormField): string {
    let html = `<select id="config-${field.key}">`;

    if (field.options) {
        field.options.forEach(option => {
            html += `<option value="${option}" ${field.value === option ? 'selected' : ''}>${option}</option>`;
        });
    }

    html += `</select>`;
    return html;
}