// src/views/figma/scripts/configure.autosave.ts
// Auto-save and data handling logic

import { showSaveFeedback, sendToPlugin } from './utils';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

/**
 * Auto-save properties when any input changes
 */
export function autoSave(currentSelection: ComponentSelection | null) {
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
    } else if (componentName === 'ScreenBuilder_frame') {
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
export function handleJourneyOptionChange(
    currentSelection: ComponentSelection | null,
    updateConfigFormCallback: () => void
) {
    if (!currentSelection) return;

    // Get the new journeyOption value
    const newOption = (document.getElementById('config-journeyOption') as HTMLSelectElement)?.value;
    console.log('Journey option changed to:', newOption);

    // Update the journeyOption in currentSelection immediately
    currentSelection.properties.journeyOption = newOption;

    // Save to Figma
    autoSave(currentSelection);

    // Rebuild the form to show correct fields
    console.log('Rebuilding form...');
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