// src/figma-api/services/formBuilder.service.ts
import fs from 'fs';
import path from 'path';

interface FieldDefinition {
    key: string;
    type: 'text' | 'checkbox' | 'select';
    label: string;
    description?: string;
    defaultValue: any;
    required: boolean;
    placeholder?: string;
    options?: string[];
    maps_to?: string;
    conditionalRules?: {
        disableWhen?: Record<string, any[]>;
        hideWhen?: Record<string, any[]>;
    };
    conditionalField?: {
        key: string;
        type: string;
        label: string;
        description?: string;
        showWhen?: Record<string, any>;
        optionsFrom?: string;
        optionsMap?: Record<string, string[]>;
        savedValue?: string;
    };
}

interface ConfigurationDefinition {
    label: string;
    description: string;
    fields: FieldDefinition[];
}

interface ComponentDefinition {
    componentType: 'frame' | 'journey';
    name: string;
    label: string;
    description: string;
    hasConfigurations?: boolean;
    configurationField?: {
        key: string;
        type: string;
        label: string;
        description: string;
        required: boolean;
    };
    commonFields?: FieldDefinition[];
    fields?: FieldDefinition[];
    configurations?: Record<string, ConfigurationDefinition>;
}

interface FormField {
    key: string;
    type: 'text' | 'checkbox' | 'select';
    label: string;
    description?: string;
    defaultValue: any;
    value?: any;
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
    configurationField?: any;
    hasConfigurations?: boolean;
}

class FormBuilderService {
    private componentDefinitions: Record<string, ComponentDefinition> | null = null;

    constructor() {
        this.loadDefinitions();
    }

    /**
     * Load unified component definitions
     */
    private loadDefinitions(): void {
        try {
            const definitionsPath = path.join(__dirname, '../definitions');
            const unifiedPath = path.join(definitionsPath, 'unified-components.json');

            this.componentDefinitions = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));

            console.log('✅ Form builder loaded unified definitions successfully');
            console.log('📋 Available components:', Object.keys(this.componentDefinitions || {}));
        } catch (error) {
            console.error('❌ Error loading definitions:', error);
            throw new Error('Failed to load unified definition file');
        }
    }

    /**
     * Get all available component definitions
     */
    getComponentDefinitions(): Record<string, ComponentDefinition> {
        if (!this.componentDefinitions) {
            throw new Error('Component definitions not loaded');
        }
        return this.componentDefinitions;
    }

    /**
     * Get definition for a specific component
     */
    getComponentDefinition(componentName: string): ComponentDefinition | null {
        if (!this.componentDefinitions) {
            throw new Error('Component definitions not loaded');
        }

        return this.componentDefinitions[componentName] || null;
    }

    /**
     * Get available journey configurations (if component has configurations)
     */
    getAvailableConfigurations(componentName: string): Array<{ value: string; label: string; description: string }> {
        const definition = this.getComponentDefinition(componentName);

        if (!definition || !definition.hasConfigurations || !definition.configurations) {
            return [];
        }

        return Object.entries(definition.configurations).map(([key, config]) => ({
            value: key,
            label: config.label,
            description: config.description
        }));
    }

    /**
     * GENERIC form builder - works for ANY component type
     * @param componentName - Name of the component (App_frame, Journey, ScreenBuilder_frame, etc.)
     * @param currentValues - Current property values
     * @param selectedConfiguration - For components with configurations (e.g., Journey's journeyOption)
     */
    buildForm(
        componentName: string,
        currentValues?: Record<string, any>,
        selectedConfiguration?: string
    ): FormConfig | null {
        const definition = this.getComponentDefinition(componentName);

        if (!definition) {
            console.warn(`⚠️  No definition found for component: ${componentName}`);
            return null;
        }

        console.log(`🔨 Building form for: ${componentName}`);
        console.log(`🔍 Has configurations:`, definition.hasConfigurations);        // ADD THIS
        console.log(`🔍 Selected configuration:`, selectedConfiguration);           // ADD THIS
        console.log(`🔍 Available configurations:`, definition.configurations ? Object.keys(definition.configurations) : 'none');  // ADD THIS

        const formFields: FormField[] = [];

        // Handle components WITH configurations (e.g., Journey)
        if (definition.hasConfigurations && definition.configurations) {
            // Add configuration selector field
            if (definition.configurationField) {
                const configurationOptions = Object.keys(definition.configurations);
                const currentConfiguration = selectedConfiguration || currentValues?.journeyOption || configurationOptions[0];

                // Don't add configurationField to formFields, return it separately
                // This allows special handling in the UI
            }

            // Add common fields (fields that appear for ALL configurations)
            if (definition.commonFields) {
                definition.commonFields.forEach(fieldDef => {
                    formFields.push(this.buildFieldConfig(fieldDef, currentValues));
                });
            }

            // Add configuration-specific fields
            const currentConfiguration = selectedConfiguration || currentValues?.journeyOption;
            if (currentConfiguration && definition.configurations[currentConfiguration]) {
                const configDef = definition.configurations[currentConfiguration];
                configDef.fields.forEach(fieldDef => {
                    formFields.push(this.buildFieldConfig(fieldDef, currentValues));
                });
            }
        }
        // Handle components WITHOUT configurations (e.g., App_frame, ScreenBuilder_frame)
        else if (definition.fields) {
            definition.fields.forEach(fieldDef => {
                formFields.push(this.buildFieldConfig(fieldDef, currentValues));
            });
        }

        return {
            componentName: definition.name,
            componentLabel: definition.label,
            title: `${definition.label} Configuration`,
            fields: formFields,
            hasConfigurations: definition.hasConfigurations,
            configurationField: definition.configurationField ? {
                ...definition.configurationField,
                options: definition.configurations ? Object.keys(definition.configurations) : [],
                value: selectedConfiguration || currentValues?.journeyOption
            } : undefined
        };
    }

    /**
     * Build a single field configuration from definition
     */
    private buildFieldConfig(fieldDef: FieldDefinition, currentValues?: Record<string, any>): FormField {
        const currentValue = currentValues?.[fieldDef.key];

        // Handle conditional field if it exists
        let conditionalFieldWithValue = fieldDef.conditionalField;
        if (conditionalFieldWithValue && currentValues) {
            // Get the saved value for the conditional field (e.g., sectionHomeOption)
            const conditionalValue = currentValues[conditionalFieldWithValue.key];
            if (conditionalValue !== undefined) {
                conditionalFieldWithValue = {
                    ...conditionalFieldWithValue,
                    savedValue: conditionalValue  // Add savedValue property
                };
            }
        }

        return {
            key: fieldDef.key,
            type: fieldDef.type,
            label: fieldDef.label,
            description: fieldDef.description,
            defaultValue: fieldDef.defaultValue,
            value: currentValue !== undefined ? currentValue : fieldDef.defaultValue,
            required: fieldDef.required,
            placeholder: fieldDef.placeholder,
            options: fieldDef.options,
            conditionalRules: fieldDef.conditionalRules,
            conditionalField: conditionalFieldWithValue
        };
    }

    /**
     * Evaluate conditional rules for a field
     * Returns whether the field should be disabled/hidden
     */
    evaluateConditionalRules(
        fieldKey: string,
        currentValues: Record<string, any>,
        componentName: string
    ): { disabled: boolean; hidden: boolean } {
        const definition = this.getComponentDefinition(componentName);
        if (!definition) {
            return { disabled: false, hidden: false };
        }

        // Find the field in the definition
        let fieldDef: FieldDefinition | undefined;

        if (definition.fields) {
            fieldDef = definition.fields.find(f => f.key === fieldKey);
        } else if (definition.commonFields) {
            fieldDef = definition.commonFields.find(f => f.key === fieldKey);
        }

        if (!fieldDef || !fieldDef.conditionalRules) {
            return { disabled: false, hidden: false };
        }

        let disabled = false;
        let hidden = false;

        // Check disableWhen rules
        if (fieldDef.conditionalRules.disableWhen) {
            for (const [dependentField, disableValues] of Object.entries(fieldDef.conditionalRules.disableWhen)) {
                if (disableValues.includes(currentValues[dependentField])) {
                    disabled = true;
                    break;
                }
            }
        }

        // Check hideWhen rules
        if (fieldDef.conditionalRules.hideWhen) {
            for (const [dependentField, hideValues] of Object.entries(fieldDef.conditionalRules.hideWhen)) {
                if (hideValues.includes(currentValues[dependentField])) {
                    hidden = true;
                    break;
                }
            }
        }

        return { disabled, hidden };
    }

    /**
     * Get conditional field options based on parent field value
     */
    getConditionalOptions(
        parentFieldKey: string,
        parentFieldValue: any,
        componentName: string
    ): string[] {
        const definition = this.getComponentDefinition(componentName);
        if (!definition) {
            return [];
        }

        // Find the parent field
        let parentField: FieldDefinition | undefined;

        if (definition.fields) {
            parentField = definition.fields.find(f => f.key === parentFieldKey);
        } else if (definition.commonFields) {
            parentField = definition.commonFields.find(f => f.key === parentFieldKey);
        }

        if (!parentField || !parentField.conditionalField?.optionsMap) {
            return [];
        }

        return parentField.conditionalField.optionsMap[parentFieldValue] || [];
    }
}

// Export singleton instance
export default new FormBuilderService();