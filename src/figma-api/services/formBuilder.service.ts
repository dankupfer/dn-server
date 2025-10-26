// src/figma-api/services/formBuilder.service.ts
import fs from 'fs';
import path from 'path';

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
    properties?: Record<string, string>;
    genericProperties?: Record<string, ComponentProperty>;
    optionConfigurations?: Record<string, any>;
    renderType?: string;
    [key: string]: any;
}

interface JourneyDefinitions {
    [componentName: string]: JourneyDefinition;
}

interface FormField {
    name: string;           // Semantic name for display/logic
    genericKey: string;     // Generic key for Figma storage (prop0, prop1, etc.)
    label: string;
    description?: string;
    type: 'text' | 'checkbox' | 'select';
    defaultValue: string | boolean;
    value?: string | boolean;
    options?: string[] | null;
    required: boolean;
}

interface FormConfig {
    journeyOption: string;
    title: string;
    fields: FormField[];
}

interface JourneyOptionMetadata {
    journeyOption: string;
    label: string;
    fieldCount: number;
}

interface FieldConfiguration {
    type: 'text' | 'checkbox' | 'select';
    options?: string[];
}

interface FieldDefinition {
    type: 'text' | 'checkbox' | 'select';
    label: string;
    description: string;
    options?: string[];
    defaultValue: string | boolean;
    conditionalOptions?: Record<string, string[]>;
}

interface commonDefinitions {
    [fieldName: string]: FieldDefinition;
}

class FormBuilderService {
    private componentDefinitions: ComponentDefinitions | null = null;
    private journeyDefinitions: JourneyDefinitions | null = null;
    private commonDefinitions: commonDefinitions | null = null;  // ← Add this

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

            const commonDefinitionsPath = path.join(definitionsPath, 'commonDefinitions.json');  // ← Add this
            this.commonDefinitions = JSON.parse(fs.readFileSync(commonDefinitionsPath, 'utf8'));  // ← Add this

            console.log('✅ Form builder loaded definitions successfully');
        } catch (error) {
            console.error('❌ Error loading definitions:', error);
            throw new Error('Failed to load definition files');
        }
    }

    /**
 * Get field configuration for common fields
 * Single source of truth for field types and options
 * @param fieldName - Semantic field name (e.g., 'section_type', 'id')
 * @returns Field configuration with type and options
 */
    private getFieldConfig(fieldName: string): FieldConfiguration {
        if (!this.commonDefinitions) {
            return { type: 'text' };
        }

        const fieldDef = this.commonDefinitions[fieldName];
        if (!fieldDef) {
            return { type: 'text' };
        }

        return {
            type: fieldDef.type,
            options: fieldDef.options
        };
    }

    /**
 * Get field definitions
 * @returns Field definitions object
 */
    getcommonDefinitions(): commonDefinitions {
        if (!this.commonDefinitions) {
            throw new Error('Field definitions not loaded');
        }
        return this.commonDefinitions;
    }

    /**
     * Get all available journey options with their forms
     * @returns Array of journey options with form metadata
     */
    getAvailableJourneyOptions(): JourneyOptionMetadata[] {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }

        const result: JourneyOptionMetadata[] = [];

        // For Journey component, extract optionConfigurations
        const journeyDef = this.journeyDefinitions['Journey'];
        if (journeyDef && journeyDef.optionConfigurations) {
            const optionConfigs = journeyDef.optionConfigurations as Record<string, any>;

            Object.keys(optionConfigs).forEach(journeyOption => {
                const config = optionConfigs[journeyOption];
                const fieldCount = Object.keys(config).length;

                result.push({
                    journeyOption: journeyOption,
                    label: journeyOption,
                    fieldCount: fieldCount
                });
            });
        }

        return result;
    }

    /**
 * Build form configuration for a journey option
 * @param journeyOption - Journey option name (e.g., 'CoreJourney', 'AssistJourney')
 * @returns Form configuration with fields
 */
    buildForm(journeyOption: string): FormConfig | null {
        if (!this.journeyDefinitions || !this.componentDefinitions) {
            throw new Error('Definitions not loaded');
        }

        // Get Journey component definition
        const journeyDef = this.journeyDefinitions['Journey'];
        if (!journeyDef || !journeyDef.optionConfigurations) {
            console.warn(`⚠️  No journey definition found`);
            return null;
        }

        // Get specific journey option configuration
        const optionConfig = journeyDef.optionConfigurations[journeyOption];
        if (!optionConfig) {
            console.warn(`⚠️  No option configuration found for: ${journeyOption}`);
            return null;
        }

        // Build form fields
        const fields: FormField[] = [];

        // Add common properties first (prop0, prop1, prop2)
        const commonProps = journeyDef.commonProperties || {};
        for (const [genericKey, propConfig] of Object.entries(commonProps)) {
            const config = propConfig as any;
            const semanticName = config.maps_to;
            const fieldDef = this.commonDefinitions?.[semanticName];

            if (fieldDef) {
                fields.push({
                    name: semanticName,
                    genericKey: genericKey,
                    label: fieldDef.label || semanticName,
                    description: fieldDef.description || '',
                    type: fieldDef.type || 'text',
                    defaultValue: fieldDef.defaultValue,
                    options: fieldDef.options || null,
                    required: true
                });
            }
        }

        // Add option-specific properties (prop3, prop4, etc.)
        for (const [genericKey, propConfig] of Object.entries(optionConfig)) {
            const config = propConfig as any;
            const semanticName = config.maps_to;

            // Check for inline type first, then fallback to commonDefinitions
            const fieldDef = this.commonDefinitions?.[semanticName];
            const fieldType = config.type || fieldDef?.type || 'text';

            fields.push({
                name: semanticName,
                genericKey: genericKey,
                label: config.label || fieldDef?.label || semanticName,
                description: config.description || fieldDef?.description || '',
                type: fieldType,
                defaultValue: config.defaultValue !== undefined ? config.defaultValue : fieldDef?.defaultValue,
                options: config.options || fieldDef?.options || null,
                required: true
            });
        }

        return {
            journeyOption: journeyOption,
            title: `${journeyOption} Configuration`,
            fields
        };
    }

    /**
     * Build form with current values pre-filled
     * @param journeyOption - Journey option name
     * @param currentValues - Current property values (semantic)
     * @returns Form configuration with pre-filled values
     */
    buildFormWithValues(journeyOption: string, currentValues: Record<string, any>): FormConfig | null {
        const formConfig = this.buildForm(journeyOption);

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