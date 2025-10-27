// src/figma-api/plugin/views/scripts/configure.ts
// FIXED: Proper event listener cleanup and conditional field handling

import { buildFormForComponent } from './configure.builders';
import { updateConditionalFields } from './configure.conditional';
import {
    autoSave as autoSaveInternal,
    handleConfigurationChange as handleConfigurationChangeInternal,
    handleClearPluginData as handleClearPluginDataInternal
} from './configure.autosave';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

// Module state
let currentSelection: ComponentSelection | null = null;

/**
 * Initialize configure tab
 */
export async function initConfigureTab() {
    console.log('✅ Configure tab initialized');

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
 * FIXED: Proper event listener cleanup
 */
async function updateConfigForm() {
    const noSelection = document.getElementById('no-selection');
    let configForm = document.getElementById('config-form');

    if (!noSelection || !configForm) return;

    if (!currentSelection || !currentSelection.componentName) {
        noSelection.style.display = 'block';
        configForm.style.display = 'none';
        return;
    }

    noSelection.style.display = 'none';
    configForm.style.display = 'block';

    try {
        // Build form (fetches config from server)
        const formHTML = await buildFormForComponent(currentSelection);

        // CRITICAL FIX: Remove ALL old event listeners by replacing the element
        const newConfigForm = configForm.cloneNode(false) as HTMLElement;
        newConfigForm.innerHTML = formHTML;
        configForm.parentNode?.replaceChild(newConfigForm, configForm);

        // Update reference to the new element
        configForm = newConfigForm;

        // SINGLE EVENT LISTENER - Added only once to fresh element
        configForm.addEventListener('change', async (e) => {
            const target = e.target as HTMLElement;

            console.log('🔔 Change event triggered by:', target.id);

            if (target.id.startsWith('config-')) {
                const fieldKey = target.id.replace('config-', '');

                // Skip configuration selector - it has its own handler
                if (fieldKey === 'journeyOption') {
                    console.log('⏭️ Skipping journeyOption - has its own handler');
                    return;
                }

                const isConditionalDropdown = fieldKey.endsWith('-option');

                if (!isConditionalDropdown) {
                    await updateConditionalFields(fieldKey, currentSelection);
                }

                autoSave();
            }
        });

        // Initial conditional field check (NO SAVE - just UI update)
        await updateConditionalFields(null, currentSelection);

        console.log('✅ Form rendered successfully');
    } catch (error) {
        console.error('❌ Error updating form:', error);
        if (configForm) {
            configForm.innerHTML = `
                <div class="section">
                    <h2>Error</h2>
                    <p class="error">Failed to load form configuration</p>
                </div>
            `;
        }
    }
}

/**
 * Auto-save wrapper
 */
export function autoSave() {
    autoSaveInternal(currentSelection);
}

/**
 * Handle configuration change (for Journey component)
 */
export function handleConfigurationChange() {
    handleConfigurationChangeInternal(currentSelection, updateConfigForm);
}

/**
 * Handle clearing all plugin data
 */
export function handleClearPluginData() {
    handleClearPluginDataInternal();
}

// Make functions available globally for inline onclick handlers
(window as any).autoSave = autoSave;
(window as any).handleConfigurationChange = handleConfigurationChange;
(window as any).handleClearPluginData = handleClearPluginData;