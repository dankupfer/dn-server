// src/figma-api/views/scripts/configure.autosave.ts
// SIMPLIFIED: Auto-save and data handling logic

import { showSaveFeedback, sendToPlugin } from './utils';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

/**
 * GENERIC auto-save - collects ALL form values dynamically
 */
export function autoSave(currentSelection: ComponentSelection | null) {
    if (!currentSelection) return;

    const updatedProperties: Record<string, any> = {};

    // Collect ALL values from form inputs (generic approach)
    const allInputs = document.querySelectorAll('[id^="config-"]');

    allInputs.forEach(input => {
        const fieldKey = input.id.replace('config-', '');

        // Skip the conditional CONTAINERS (divs), not the actual select elements
        if (fieldKey.endsWith('-conditional')) {
            return;
        }

        if (input instanceof HTMLInputElement) {
            if (input.type === 'checkbox') {
                updatedProperties[fieldKey] = input.checked;
            } else {
                updatedProperties[fieldKey] = input.value;
            }
        } else if (input instanceof HTMLSelectElement) {
            // Map conditional dropdown IDs to their actual Figma property names
            if (fieldKey === 'sectionHome-option') {
                updatedProperties['sectionHomeOption'] = input.value;
            } else {
                updatedProperties[fieldKey] = input.value;
            }
        }
    });

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
 * Handle configuration change (for components with configurations like Journey)
 */
export function handleConfigurationChange(
    currentSelection: ComponentSelection | null,
    updateConfigFormCallback: () => void
) {
    if (!currentSelection) return;

    const configurationSelect = document.getElementById('config-journeyOption') as HTMLSelectElement;
    if (!configurationSelect) return;

    const newConfiguration = configurationSelect.value;
    console.log('🔄 Configuration changed to:', newConfiguration);

    // CRITICAL: Update BOTH the Figma property AND the in-memory object
    // Find the actual journeyOption key (might have suffix like #313:51)
    const journeyOptionKey = Object.keys(currentSelection.properties).find(key =>
        key === 'journeyOption' || key.startsWith('journeyOption#')
    );

    if (journeyOptionKey) {
        currentSelection.properties[journeyOptionKey] = newConfiguration;
    }
    currentSelection.properties.journeyOption = newConfiguration;  // Also set the clean version

    // Save to Figma
    autoSave(currentSelection);

    // NOW rebuild - currentSelection has the updated value
    updateConfigFormCallback();
}

/**
 * Handle clearing all plugin data
 */
export function handleClearPluginData() {
    if (!confirm('This will clear all saved configuration data from the selected component(s). Continue?')) {
        return;
    }

    sendToPlugin({ type: 'clear-plugin-data' });
}