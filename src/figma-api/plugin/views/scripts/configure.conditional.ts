// src/figma-api/views/scripts/configure.conditional.ts
// SIMPLIFIED: Single function to update conditional fields based on server response

import { fetchConditionalRules } from './api';

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

/**
 * Update conditional fields based on form state
 * Called when a field changes OR on initial render
 * @param changedFieldKey - The field that just changed (null for initial render)
 * @param currentSelection - Current component selection
 */
export async function updateConditionalFields(
    changedFieldKey: string | null,
    currentSelection: ComponentSelection | null
) {
    if (!currentSelection) return;

    const { componentName } = currentSelection;
    const currentValues = collectCurrentValues();

    try {
        // Ask server: "Given current form state, what should each field look like?"
        const response = await fetchConditionalRules(
            componentName,
            changedFieldKey,
            currentValues
        );

        // Apply the states the server told us
        response.affectedFields?.forEach((field: any) => {
            applyFieldState(field.key, field);
        });

    } catch (error) {
        console.error('Error updating conditional fields:', error);
    }
}

/**
 * Apply field state (enable/disable, show/hide, update options)
 */
function applyFieldState(fieldKey: string, state: any) {
    const input = document.getElementById(`config-${fieldKey}`);
    const inputGroup = document.getElementById(`input-group-${fieldKey}`);

    if (!input || !inputGroup) return;

    // Handle disabled state
    if (state.disabled !== undefined) {
        (input as HTMLInputElement).disabled = state.disabled;
        inputGroup.style.opacity = state.disabled ? '0.5' : '1';
        inputGroup.style.pointerEvents = state.disabled ? 'none' : 'auto';

        // If checkbox is disabled, uncheck it
        if (state.disabled && input instanceof HTMLInputElement && input.type === 'checkbox') {
            input.checked = false;
        }
    }

    // Handle hidden state
    if (state.hidden !== undefined) {
        inputGroup.style.display = state.hidden ? 'none' : 'block';
    }

    // Handle conditional field visibility (for checkboxes with dropdown)
    if (state.showConditionalField !== undefined) {
        const conditionalContainer = document.getElementById(`config-${fieldKey}-conditional`);
        if (conditionalContainer) {
            conditionalContainer.style.display = state.showConditionalField ? 'block' : 'none';
        }
    }

    // Handle conditional field options (populate dropdown)
    if (state.conditionalOptions) {
        const optionSelect = document.getElementById(`config-${fieldKey}-option`) as HTMLSelectElement;
        if (optionSelect) {
            const currentValue = optionSelect.value;
            const savedValue = optionSelect.getAttribute('data-saved-value') || '';  // Get from data attribute

            optionSelect.innerHTML = '';
            state.conditionalOptions.forEach((option: string) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionSelect.appendChild(optionElement);
            });

            // Priority: server savedConditionalValue > data-saved-value > current value
            if (state.savedConditionalValue) {
                optionSelect.value = state.savedConditionalValue;
            } else if (savedValue && state.conditionalOptions.includes(savedValue)) {
                optionSelect.value = savedValue;
            } else if (currentValue && state.conditionalOptions.includes(currentValue)) {
                optionSelect.value = currentValue;
            }
        }
    }
}

/**
 * Collect current values from all form inputs
 */
function collectCurrentValues(): Record<string, any> {
    const values: Record<string, any> = {};
    const allInputs = document.querySelectorAll('[id^="config-"]');

    allInputs.forEach(input => {
        const fieldKey = input.id.replace('config-', '');

        if (input instanceof HTMLInputElement) {
            if (input.type === 'checkbox') {
                values[fieldKey] = input.checked;
            } else {
                values[fieldKey] = input.value;
            }
        } else if (input instanceof HTMLSelectElement) {
            values[fieldKey] = input.value;
        }
    });

    return values;
}