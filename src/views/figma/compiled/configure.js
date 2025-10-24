import { fetchComponentTypes, fetchFormConfig } from './api';
import { showSaveFeedback, sendToPlugin } from './utils';
let currentSelection = null;
export function initConfigureTab() {
    console.log('Configure tab initialized');
}
export function updateSelection(selection) {
    currentSelection = selection;
    updateConfigForm();
}
async function updateConfigForm() {
    const noSelection = document.getElementById('no-selection');
    const configForm = document.getElementById('config-form');
    if (!noSelection || !configForm)
        return;
    if (!currentSelection || !currentSelection.componentName) {
        noSelection.style.display = 'block';
        configForm.style.display = 'none';
        return;
    }
    noSelection.style.display = 'none';
    configForm.style.display = 'block';
    const formHTML = await buildFormForComponent(currentSelection);
    configForm.innerHTML = formHTML;
}
async function buildFormForComponent(selection) {
    const { componentName, properties } = selection;
    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;
    if (componentName === 'Journey') {
        const journeyType = properties.Type || 'AccountCard';
        try {
            const formConfig = await fetchFormConfig(journeyType);
            html += await buildJourneyTypeSelector(properties);
            html += buildDynamicFields(formConfig.fields, properties);
        }
        catch (error) {
            console.error('Error fetching form config:', error);
            html += `<p class="error">Error loading form: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
        }
    }
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
async function buildJourneyTypeSelector(properties) {
    try {
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
    }
    catch (error) {
        console.error('Error building type selector:', error);
        return '<p class="error">Error loading component types</p>';
    }
}
function buildDynamicFields(fields, properties) {
    let html = '';
    fields.forEach(field => {
        const value = properties[field.genericKey] || field.defaultValue;
        html += `<div class="input-group">`;
        html += `<label for="config-${field.genericKey}">${field.label}</label>`;
        if (field.type === 'text') {
            html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
        }
        else if (field.type === 'checkbox') {
            html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? 'checked' : ''} onchange="autoSave()">`;
        }
        else if (field.type === 'select' && field.options) {
            html += `<select id="config-${field.genericKey}" onchange="autoSave()">`;
            field.options.forEach((option) => {
                html += `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
            });
            html += `</select>`;
        }
        html += `</div>`;
    });
    return html;
}
function buildAppFrameForm(properties) {
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
function buildScreenBuilderForm(properties) {
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
function buildModalForm(properties) {
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
export function autoSave() {
    if (!currentSelection)
        return;
    const componentName = currentSelection.componentName;
    const updatedProperties = {};
    if (componentName === 'App_frame') {
        updatedProperties.brand = document.getElementById('config-brand')?.value;
        updatedProperties.mode = document.getElementById('config-mode')?.value;
        updatedProperties.apiBase = document.getElementById('config-apiBase')?.value;
    }
    else if (componentName === 'Journey') {
        updatedProperties.Type = document.getElementById('config-Type')?.value;
        for (let i = 0; i < 10; i++) {
            const propKey = `prop${i}`;
            const element = document.getElementById(`config-${propKey}`);
            if (element) {
                if (element instanceof HTMLInputElement) {
                    if (element.type === 'checkbox') {
                        updatedProperties[propKey] = element.checked;
                    }
                    else {
                        updatedProperties[propKey] = element.value;
                    }
                }
                else if (element instanceof HTMLSelectElement) {
                    updatedProperties[propKey] = element.value;
                }
            }
        }
    }
    else if (componentName === 'ScreenBuilder_frame' || componentName === 'Modal_frame') {
        updatedProperties.id = document.getElementById('config-id')?.value;
        updatedProperties.section_type = document.getElementById('config-section_type')?.value;
    }
    sendToPlugin({
        type: 'update-properties',
        properties: updatedProperties
    });
    showSaveFeedback();
}
export function handleTypeChange() {
    if (!currentSelection)
        return;
    const newType = document.getElementById('config-Type')?.value;
    console.log('Type changed to:', newType);
    currentSelection.properties.Type = newType;
    autoSave();
    console.log('Rebuilding form...');
    updateConfigForm();
}
window.autoSave = autoSave;
window.handleTypeChange = handleTypeChange;
