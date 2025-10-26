// src/figma-api/views/scripts/configure.ts
// Configure tab - main orchestrator for component configuration

import { fetchFieldDefinitions } from './api';

// Import all functions from the new modular files
import {
    shouldDisableField,
    setupConditionalFieldListeners,
    applyConditionalRules,
    toggleSectionHomeOptions,
    updateSectionHomeOptions
} from './configure.conditional';

import {
    buildFormForComponent,
    buildFieldFromDefinition,
    buildDynamicFields,
    buildJourneyOptionSelector,
    buildAppFrameForm,
    buildScreenBuilderForm,
} from './configure.builders';

import {
    autoSave as autoSaveInternal,
    handleJourneyOptionChange as handleJourneyOptionChangeInternal,
    handleClearPluginData as handleClearPluginDataInternal
} from './configure.autosave';

// Re-export for backward compatibility
export {
    shouldDisableField,
    setupConditionalFieldListeners,
    applyConditionalRules,
    toggleSectionHomeOptions,
    updateSectionHomeOptions,
    buildFormForComponent,
    buildFieldFromDefinition,
    buildDynamicFields,
    buildJourneyOptionSelector,
    buildAppFrameForm,
    buildScreenBuilderForm,
};

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

// Module state
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
    const formHTML = await buildFormForComponent(currentSelection, fieldDefinitions);
    configForm.innerHTML = formHTML;

    // Add event listeners for conditional fields
    setupConditionalFieldListeners(currentSelection, fieldDefinitions, autoSave);
}

/**
 * Auto-save wrapper that uses module state
 */
export function autoSave() {
    autoSaveInternal(currentSelection);
}

/**
 * Handle Journey Option change wrapper
 */
export function handleJourneyOptionChange() {
    handleJourneyOptionChangeInternal(currentSelection, updateConfigForm);
}

/**
 * Handle clearing all plugin data wrapper
 */
export function handleClearPluginData() {
    handleClearPluginDataInternal();
}

// Make functions available globally for inline onclick handlers
(window as any).autoSave = autoSave;
(window as any).handleJourneyOptionChange = handleJourneyOptionChange;
(window as any).handleClearPluginData = handleClearPluginData;