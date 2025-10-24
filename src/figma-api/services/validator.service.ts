// src/figma-api/services/validator.service.ts
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

interface FrameDefinitions {
    [frameType: string]: any;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

interface ScreenDataComponent {
    type: string;
    props: Record<string, any>;
    style?: Record<string, any>;
}

interface ScreenData {
    scrollable?: boolean;
    components: ScreenDataComponent[];
    style?: Record<string, any>;
}

interface ModuleRequest {
    moduleName?: string;
    moduleId?: string;
    screenData?: ScreenData;
    [key: string]: any;
}

class ValidatorService {
    private componentDefinitions: ComponentDefinitions | null = null;
    private journeyDefinitions: JourneyDefinitions | null = null;
    private frameDefinitions: FrameDefinitions | null = null;

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

            const framesPath = path.join(definitionsPath, 'frames.json');
            this.frameDefinitions = JSON.parse(fs.readFileSync(framesPath, 'utf8'));

            console.log('✅ Validator loaded definitions successfully');
        } catch (error) {
            console.error('❌ Error loading definitions:', error);
            throw new Error('Failed to load definition files');
        }
    }

    /**
     * Validate component configuration
     * @param componentType - Component type (e.g., 'AccountCard')
     * @param properties - Component properties (semantic names)
     * @returns Validation result
     */
    validateComponent(componentType: string, properties: Record<string, any>): ValidationResult {
        const errors: string[] = [];

        if (!this.componentDefinitions || !this.journeyDefinitions) {
            throw new Error('Definitions not loaded');
        }

        // Check if component type exists
        if (!this.componentDefinitions[componentType]) {
            errors.push(`Unknown component type: ${componentType}`);
            return { valid: false, errors };
        }

        if (!this.journeyDefinitions[componentType]) {
            errors.push(`No journey definition found for: ${componentType}`);
            return { valid: false, errors };
        }

        const componentDef = this.componentDefinitions[componentType];
        const journeyDef = this.journeyDefinitions[componentType];

        // Validate each property
        if (componentDef.properties) {
            for (const [propName, propDef] of Object.entries(componentDef.properties)) {
                const value = properties[propName];

                // Check if required property is missing
                if (value === undefined || value === null || value === '') {
                    errors.push(`Missing required property: ${propName}`);
                    continue;
                }

                // Validate property type
                const typeError = this.validatePropertyType(propName, value, propDef);
                if (typeError) {
                    errors.push(typeError);
                }

                // Validate variant options
                if (propDef.type === 'VARIANT' && propDef.variantOptions) {
                    if (!propDef.variantOptions.includes(value as string)) {
                        errors.push(`Invalid variant for ${propName}: "${value}". Valid options: ${propDef.variantOptions.join(', ')}`);
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate property type
     * @param propName - Property name
     * @param value - Property value
     * @param propDef - Property definition
     * @returns Error message or null
     */
    private validatePropertyType(propName: string, value: any, propDef: ComponentProperty): string | null {
        switch (propDef.type) {
            case 'TEXT':
                if (typeof value !== 'string') {
                    return `Property ${propName} must be a string, got ${typeof value}`;
                }
                break;
            case 'BOOLEAN':
                if (typeof value !== 'boolean') {
                    return `Property ${propName} must be a boolean, got ${typeof value}`;
                }
                break;
            case 'VARIANT':
                if (typeof value !== 'string') {
                    return `Property ${propName} must be a string (variant name), got ${typeof value}`;
                }
                break;
        }
        return null;
    }

    /**
     * Validate frame configuration
     * @param frameType - Frame type (e.g., 'ScreenBuilder', 'Journey')
     * @returns Validation result
     */
    validateFrame(frameType: string): ValidationResult {
        const errors: string[] = [];

        if (!this.frameDefinitions) {
            throw new Error('Frame definitions not loaded');
        }

        if (!this.frameDefinitions[frameType]) {
            errors.push(`Unknown frame type: ${frameType}`);
            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Validate screenData structure for module generation
     * @param screenData - Screen data object
     * @returns Validation result
     */
    validateScreenData(screenData: ScreenData): ValidationResult {
        const errors: string[] = [];

        if (!screenData) {
            errors.push('screenData is required');
            return { valid: false, errors };
        }

        if (typeof screenData.scrollable !== 'boolean') {
            errors.push('screenData.scrollable must be a boolean');
        }

        if (!Array.isArray(screenData.components)) {
            errors.push('screenData.components must be an array');
            return { valid: false, errors };
        }

        if (!this.componentDefinitions) {
            throw new Error('Component definitions not loaded');
        }

        // Validate each component in the screen
        screenData.components.forEach((component, index) => {
            if (!component.type) {
                errors.push(`Component at index ${index} missing type`);
                return;
            }

            if (!component.props) {
                errors.push(`Component at index ${index} missing props`);
                return;
            }

            // Validate component type exists
            if (!this.componentDefinitions![component.type]) {
                errors.push(`Component at index ${index} has unknown type: ${component.type}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate module creation request
     * @param request - Module creation request
     * @returns Validation result
     */
    validateModuleRequest(request: ModuleRequest): ValidationResult {
        const errors: string[] = [];

        if (!request.moduleName) {
            errors.push('moduleName is required');
        }

        if (!request.moduleId) {
            errors.push('moduleId is required');
        }

        if (!request.screenData) {
            errors.push('screenData is required');
        } else {
            // Validate screen data structure
            const screenDataValidation = this.validateScreenData(request.screenData);
            if (!screenDataValidation.valid) {
                errors.push(...screenDataValidation.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get list of all valid component types
     * @returns Array of component type names
     */
    getValidComponentTypes(): string[] {
        if (!this.componentDefinitions) {
            throw new Error('Component definitions not loaded');
        }
        return Object.keys(this.componentDefinitions);
    }

    /**
     * Get list of all valid frame types
     * @returns Array of frame type names
     */
    getValidFrameTypes(): string[] {
        if (!this.frameDefinitions) {
            throw new Error('Frame definitions not loaded');
        }
        return Object.keys(this.frameDefinitions);
    }
}

// Export singleton instance
export default new ValidatorService();