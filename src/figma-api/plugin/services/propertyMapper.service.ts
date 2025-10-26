// src/figma-api/services/propertyMapper.service.ts
import fs from 'fs';
import path from 'path';

interface PropertyMap {
    [key: string]: string; // prop0 -> title, prop1 -> balance, etc.
}

interface JourneyDefinition {
    properties: PropertyMap;
    renderType?: string;
    [key: string]: any;
}

interface JourneyDefinitions {
    [componentType: string]: JourneyDefinition;
}

interface ComponentDefinitions {
    [componentType: string]: any;
}

class PropertyMapperService {
    private journeyDefinitions: JourneyDefinitions | null = null;
    private componentDefinitions: ComponentDefinitions | null = null;

    constructor() {
        this.loadDefinitions();
    }

    /**
     * Load all definition files
     */
    private loadDefinitions(): void {
        try {
            const definitionsPath = path.join(__dirname, '../definitions');

            // Load journey definitions (has property mappings)
            const journeysPath = path.join(definitionsPath, 'journeys.json');
            this.journeyDefinitions = JSON.parse(fs.readFileSync(journeysPath, 'utf8'));

            // Load component definitions (for validation)
            const componentsPath = path.join(definitionsPath, 'components.json');
            this.componentDefinitions = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

            console.log('✅ Property mapper loaded definitions successfully');
        } catch (error) {
            console.error('❌ Error loading definitions:', error);
            throw new Error('Failed to load definition files');
        }
    }

    /**
     * Map generic properties (prop0-prop9) to semantic names
     * @param componentType - Component type (e.g., 'AccountCard')
     * @param genericProps - Object with prop0, prop1, etc.
     * @returns Object with semantic property names
     */
    mapProperties(componentType: string, genericProps: Record<string, any>): Record<string, any> {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }

        // Find the journey definition for this component type
        const journeyDef = this.journeyDefinitions[componentType];

        if (!journeyDef) {
            console.warn(`⚠️  No journey definition found for component type: ${componentType}`);
            return genericProps; // Return as-is if no mapping found
        }

        const propertyMap = journeyDef.properties;
        if (!propertyMap) {
            console.warn(`⚠️  No property map found for component type: ${componentType}`);
            return genericProps;
        }

        // Map each generic property to its semantic name
        const semanticProps: Record<string, any> = {};

        for (const [genericKey, semanticName] of Object.entries(propertyMap)) {
            if (genericProps.hasOwnProperty(genericKey)) {
                semanticProps[semanticName] = genericProps[genericKey];
            }
        }

        return semanticProps;
    }

    /**
     * Reverse map: semantic names back to generic properties
     * Useful when saving back to Figma plugin data
     * @param componentType - Component type
     * @param semanticProps - Object with semantic property names
     * @returns Object with prop0, prop1, etc.
     */
    unmapProperties(componentType: string, semanticProps: Record<string, any>): Record<string, any> {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }

        const journeyDef = this.journeyDefinitions[componentType];

        if (!journeyDef || !journeyDef.properties) {
            return semanticProps;
        }

        const propertyMap = journeyDef.properties;
        const genericProps: Record<string, any> = {};

        // Reverse the mapping
        for (const [genericKey, semanticName] of Object.entries(propertyMap)) {
            if (semanticProps.hasOwnProperty(semanticName)) {
                genericProps[genericKey] = semanticProps[semanticName];
            }
        }

        return genericProps;
    }

    /**
     * Get all available component types
     * @returns Array of component type names
     */
    getAvailableComponents(): string[] {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }
        return Object.keys(this.journeyDefinitions);
    }

    /**
     * Get property mapping for a specific component type
     * @param componentType - Component type
     * @returns Property mapping (prop0 → title, etc.)
     */
    getPropertyMapping(componentType: string): PropertyMap {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }
        const journeyDef = this.journeyDefinitions[componentType];
        return journeyDef?.properties || {};
    }

    /**
     * Validate if a component type exists
     * @param componentType - Component type to validate
     * @returns boolean
     */
    isValidComponentType(componentType: string): boolean {
        if (!this.journeyDefinitions) {
            throw new Error('Journey definitions not loaded');
        }
        return this.journeyDefinitions.hasOwnProperty(componentType);
    }
}

// Export singleton instance
export default new PropertyMapperService();