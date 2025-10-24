// src/figma-api/services/formBuilder.service.ts
import fs from 'fs';
import path from 'path';
import propertyMapper from './propertyMapper.service';

interface ComponentProperty {
    type: 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP' | 'VARIANT';
    defaultValue: string | boolean;
    variantOptions?: string[];
}

interface ComponentDefinition {
    name: string;
    width: number;
    height: number;
    backgroundColor: string;
    properties?: Record<string, ComponentProperty>;
    [key: string]: any;
}

interface ComponentDefinitions {
    [componentType: string]: ComponentDefinition;
}

interface JourneyDefinition {
    properties: Record<string, string>;
    renderType?: string;
    [key: string]: any;
}

interface JourneyDefinitions {
    [componentType: string]: JourneyDefinition;
}

interface FormField {
    name: string;           // Semantic name for display/logic
    genericKey: string;     // Generic key for Figma storage (prop0, prop1, etc.)
    label: string;
    type: 'text' | 'checkbox' | 'select';
    defaultValue: string | boolean;
    value?: string | boolean;
    options?: string[] | null;
    required: boolean;
}

interface FormConfig {
    componentType: string;
    title: string;
    fields: FormField[];
}

interface ComponentFormMetadata {
    componentType: string;
    label: string;
    fieldCount: number;
}

class FormBuilderService {
    private componentDefinitions: ComponentDefinitions | null = null;
    private journeyDefinitions: JourneyDefinitions | null = null;

    constructor() {
        this.loadDefinitions();
    }

    /**
     * Load definition files
     */
    private loadDefinitions(): void {
        try {
            const definitionsPath = path.join(__dirname, '../definitions');

            const componentsPath = path.join(definitionsPath, 'components.json');
            this.componentDefinitions = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

            const journeysPath = path.join(definitionsPath, 'journeys.json');
            this.journeyDefinitions = JSON.parse(fs.readFileSync(journeysPath, 'utf8'));

            console.log('✅ Form builder loaded definitions successfully');
        } catch (error) {
            console.error('❌ Error loading definitions:', error);
            throw new Error('Failed to load definition files');
        }
    }

    /**
     * Build form configuration for a component type
     * @param componentType - Component type (e.g., 'AccountCard')
     * @returns Form configuration with fields
     */
    buildForm(componentType: string): FormConfig | null {
        if (!this.journeyDefinitions || !this.componentDefinitions) {
            throw new Error('Definitions not loaded');
        }

        // Check if component exists in journey definitions
        const journeyDef = this.journeyDefinitions[componentType];
        if (!journeyDef) {
            console.warn(`⚠️  No journey definition found for: ${componentType}`);
            return null;
        }

        // Get component definition for additional details
        const componentDef = this.componentDefinitions[componentType];

        // Get property mapping
        const propertyMap = journeyDef.properties || {};

        // Build form fields
        const fields: FormField[] = [];

        for (const [genericKey, semanticName] of Object.entries(propertyMap)) {
            const field = this.createField(genericKey, semanticName, componentDef);
            if (field) {
                fields.push(field);
            }
        }

        return {
            componentType,
            title: `${componentType} Properties`,
            fields
        };
    }

    /**
     * Create a form field configuration
     * @param genericKey - Generic property key (prop0, prop1, etc.)
     * @param semanticName - Semantic property name (title, balance, etc.)
     * @param componentDef - Component definition (optional)
     * @returns Field configuration
     */
    private createField(genericKey: string, semanticName: string, componentDef?: ComponentDefinition): FormField | null {
        // Get property definition if available
        const propertyDef = componentDef?.properties?.[semanticName];

        // Determine field type based on property definition
        let fieldType: 'text' | 'checkbox' | 'select' = 'text'; // default
        let options: string[] | null = null;
        let defaultValue: string | boolean = '';

        if (propertyDef) {
            switch (propertyDef.type) {
                case 'TEXT':
                    fieldType = 'text';
                    defaultValue = propertyDef.defaultValue as string || '';
                    break;
                case 'BOOLEAN':
                    fieldType = 'checkbox';
                    defaultValue = propertyDef.defaultValue as boolean || false;
                    break;
                case 'VARIANT':
                    fieldType = 'select';
                    options = propertyDef.variantOptions || [];
                    defaultValue = (propertyDef.defaultValue as string) || (options[0] || '');
                    break;
                default:
                    fieldType = 'text';
            }
        }

        // Create user-friendly label from semantic name
        const label = this.createLabel(semanticName);

        return {
            name: semanticName,          // Semantic name for display/logic
            genericKey: genericKey,      // Generic key for Figma storage
            label: label,
            type: fieldType,
            defaultValue: defaultValue,
            options: options,
            required: true               // Can be made configurable
        };
    }

    /**
     * Create a user-friendly label from property name
     * @param propertyName - Property name (e.g., 'accountNumber')
     * @returns Label (e.g., 'Account Number')
     */
    private createLabel(propertyName: string): string {
        // Convert camelCase to Title Case
        return propertyName
            .replace(/([A-Z])/g, ' $1')           // Add space before capital letters
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .trim();
    }

    /**
     * Get all available component types with their forms
     * @returns Array of component types with form metadata
     */
    getAvailableComponentForms(): ComponentFormMetadata[] {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }

        const componentTypes = Object.keys(this.journeyDefinitions);

        return componentTypes.map(type => ({
            componentType: type,
            label: this.createLabel(type),
            fieldCount: Object.keys(this.journeyDefinitions![type].properties || {}).length
        }));
    }

    /**
     * Build form with current values pre-filled
     * @param componentType - Component type
     * @param currentValues - Current property values (semantic)
     * @returns Form configuration with pre-filled values
     */
    buildFormWithValues(componentType: string, currentValues: Record<string, any>): FormConfig | null {
        const formConfig = this.buildForm(componentType);

        if (!formConfig) {
            return null;
        }

        // Pre-fill current values
        formConfig.fields = formConfig.fields.map(field => ({
            ...field,
            value: currentValues[field.name] !== undefined
                ? currentValues[field.name]
                : field.defaultValue
        }));

        return formConfig;
    }
}

// Export singleton instance
export default new FormBuilderService();