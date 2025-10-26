// src/figma-api/views/scripts/configure.conditional.ts
// Conditional field logic for dynamic form behavior

interface ComponentSelection {
    componentName: string;
    properties: Record<string, any>;
}

/**
 * Check if a field should be disabled based on conditional rules
 */
export function shouldDisableField(
    fieldName: string,
    dependentFieldValue: any,
    fieldDefinitions: any
): boolean {
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
export function setupConditionalFieldListeners(
    currentSelection: ComponentSelection | null,
    fieldDefinitions: any,
    autoSaveCallback: () => void
) {
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
        // ScreenBuilder use semantic IDs
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
            toggleSectionHomeOptions(
                conditionalContainerId,
                sectionHomeCheckboxId,
                fieldDefinitions,
                currentSelection
            );
            autoSaveCallback();
        });
    }

    if (sectionTypeSelect) {
        sectionTypeSelect.addEventListener('change', () => {
            // Update conditional rules (disable/enable sectionHome)
            applyConditionalRules(
                sectionTypeSelectId,
                sectionHomeCheckboxId,
                sectionHomeInputGroupId,
                fieldDefinitions
            );

            // Update dropdown options
            updateSectionHomeOptions(
                sectionTypeSelectId,
                conditionalContainerId,
                sectionHomeOptionSelectId,
                fieldDefinitions,
                currentSelection
            );

            autoSaveCallback();
        });
    }

    // Initial application of conditional rules
    applyConditionalRules(
        sectionTypeSelectId,
        sectionHomeCheckboxId,
        sectionHomeInputGroupId,
        fieldDefinitions
    );

    // Initial render of conditional field
    toggleSectionHomeOptions(
        conditionalContainerId,
        sectionHomeCheckboxId,
        fieldDefinitions,
        currentSelection
    );
}

/**
 * Apply conditional rules (disable/hide fields based on other field values)
 */
export function applyConditionalRules(
    sectionTypeSelectId: string,
    sectionHomeCheckboxId: string,
    sectionHomeInputGroupId: string,
    fieldDefinitions: any
) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId) as HTMLSelectElement;
    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId) as HTMLInputElement;
    const sectionHomeInputGroup = document.getElementById(sectionHomeInputGroupId);

    if (!sectionTypeSelect || !sectionHomeCheckbox || !sectionHomeInputGroup) return;

    const sectionTypeValue = sectionTypeSelect.value;
    const shouldDisable = shouldDisableField('sectionHome', sectionTypeValue, fieldDefinitions);

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
export function toggleSectionHomeOptions(
    conditionalContainerId: string,
    checkboxId: string,
    fieldDefinitions: any,
    currentSelection: ComponentSelection | null
) {
    const sectionHomeCheckbox = document.getElementById(checkboxId) as HTMLInputElement;
    const conditionalContainer = document.getElementById(conditionalContainerId);

    if (!conditionalContainer) return;

    // Only show if checkbox is checked AND not disabled
    if (sectionHomeCheckbox && sectionHomeCheckbox.checked && !sectionHomeCheckbox.disabled) {
        conditionalContainer.style.display = 'block';

        // Determine the select ID based on container ID
        const selectId = conditionalContainerId.replace('-conditional', '-option');
        const sectionTypeId = checkboxId.replace('sectionHome', 'section_type').replace('prop2', 'prop1');

        updateSectionHomeOptions(
            sectionTypeId,
            conditionalContainerId,
            selectId,
            fieldDefinitions,
            currentSelection
        );
    } else {
        conditionalContainer.style.display = 'none';
    }
}

/**
 * Update sectionHome dropdown options based on section_type value
 */
export function updateSectionHomeOptions(
    sectionTypeSelectId: string,
    conditionalContainerId: string,
    selectId: string,
    fieldDefinitions: any,
    currentSelection: ComponentSelection | null
) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId) as HTMLSelectElement;
    const optionSelect = document.getElementById(selectId) as HTMLSelectElement;

    if (!sectionTypeSelect || !optionSelect) return;

    const sectionType = sectionTypeSelect.value;
    const fieldDef = fieldDefinitions?.sectionHome;

    if (!fieldDef || !fieldDef.conditionalOptions) return;

    const options = fieldDef.conditionalOptions[sectionType] || [];

    // Clear existing options
    optionSelect.innerHTML = '';

    // Add new options
    options.forEach((option: string) => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        optionSelect.appendChild(optionElement);
    });

    // Try to restore saved value if it exists
    if (currentSelection?.properties.sectionHomeOption) {
        optionSelect.value = currentSelection.properties.sectionHomeOption;
    }
}