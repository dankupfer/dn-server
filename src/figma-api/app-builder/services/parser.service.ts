// figma-api/app-builder/services/parser.service.ts

/**
 * PARSER SERVICE
 * 
 * Validates and normalizes fullAppConfig.json from Figma plugin.
 * Handles data transformation, validation, and Journey config extraction.
 */

import {
    FullAppConfig,
    FigmaComponent,
    NormalizedComponent,
    ParseResult,
    ValidationError,
    JourneyConfig,
    JourneyType,
    SectionType,
    ComponentProperties
} from '../types/appBuilder.types';

/**
 * Main parser function
 * Takes raw fullAppConfig and returns validated, normalized components
 */
export function parseAppConfig(rawConfig: any): ParseResult {
    const errors: ValidationError[] = [];

    // Step 1: Validate structure
    const structureValid = validateStructure(rawConfig, errors);
    if (!structureValid) {
        return {
            success: false,
            errors
        };
    }

    const config = rawConfig as FullAppConfig;

    // Step 2: Validate app frame
    validateAppFrame(config.appFrame, errors);

    // Step 3: Normalize components
    const normalized = normalizeComponents(config.components, errors);

    // Step 4: Check for critical errors
    const hasCriticalErrors = errors.some(e => e.type === 'error');

    return {
        success: !hasCriticalErrors,
        config,
        normalized,
        errors
    };
}

/**
 * Validate basic structure of config
 */
function validateStructure(config: any, errors: ValidationError[]): boolean {
    if (!config || typeof config !== 'object') {
        errors.push({
            type: 'error',
            message: 'Config must be a valid object'
        });
        return false;
    }

    // Required top-level fields
    if (!config.appName || typeof config.appName !== 'string') {
        errors.push({
            type: 'error',
            field: 'appName',
            message: 'appName is required and must be a string'
        });
    }

    if (!config.appFrame || typeof config.appFrame !== 'object') {
        errors.push({
            type: 'error',
            field: 'appFrame',
            message: 'appFrame is required and must be an object'
        });
    }

    if (!Array.isArray(config.components)) {
        errors.push({
            type: 'error',
            field: 'components',
            message: 'components is required and must be an array'
        });
        return false;
    }

    if (config.components.length === 0) {
        errors.push({
            type: 'warning',
            field: 'components',
            message: 'No components found in config'
        });
    }

    return errors.filter(e => e.type === 'error').length === 0;
}

/**
 * Validate app frame configuration
 */
function validateAppFrame(appFrame: any, errors: ValidationError[]): void {
    if (!appFrame.brand || typeof appFrame.brand !== 'string') {
        errors.push({
            type: 'error',
            field: 'appFrame.brand',
            message: 'Brand is required'
        });
    }

    if (!appFrame.mode || !['light', 'dark'].includes(appFrame.mode)) {
        errors.push({
            type: 'error',
            field: 'appFrame.mode',
            message: 'Mode must be either "light" or "dark"'
        });
    }

    if (!appFrame.apiBase || typeof appFrame.apiBase !== 'string') {
        errors.push({
            type: 'warning',
            field: 'appFrame.apiBase',
            message: 'API base URL is recommended'
        });
    }
}

/**
 * Normalize all components
 */
function normalizeComponents(
    components: FigmaComponent[],
    errors: ValidationError[]
): NormalizedComponent[] {
    const normalized: NormalizedComponent[] = [];
    const seenIds = new Set<string>();

    for (const component of components) {
        try {
            const normalizedComponent = normalizeComponent(component, errors, seenIds);
            if (normalizedComponent) {
                normalized.push(normalizedComponent);
                seenIds.add(normalizedComponent.id);
            }
        } catch (error) {
            errors.push({
                type: 'error',
                message: `Failed to normalize component: ${error instanceof Error ? error.message : 'Unknown error'}`,
                component: component.nodeId
            });
        }
    }

    return normalized;
}

/**
 * Normalize a single component
 */
function normalizeComponent(
    component: FigmaComponent,
    errors: ValidationError[],
    seenIds: Set<string>
): NormalizedComponent | null {
    const props = component.properties;

    // Extract and validate ID
    const id = extractId(props, component.nodeId);
    if (!id) {
        errors.push({
            type: 'error',
            message: 'Component must have an id property',
            component: component.nodeId
        });
        return null;
    }

    // Check for duplicate IDs
    if (seenIds.has(id)) {
        errors.push({
            type: 'warning',
            message: `Duplicate ID found: ${id}. Using last occurrence.`,
            component: component.nodeId
        });
    }

    // Extract section type
    const sectionType = extractSectionType(props, component.componentName);

    // Extract sectionHome flag
    const isHome = extractSectionHome(props);

    // Extract and normalize homeSection
    let homeSection: string | undefined;
    if (isHome) {
        homeSection = extractHomeSection(props, errors, component.nodeId);
    }

    // Build normalized component
    const normalized: NormalizedComponent = {
        id,
        componentType: component.componentName,
        nodeId: component.nodeId,
        sectionType,
        isHome,
        homeSection,
        properties: props
    };

    // Handle Journey-specific configuration
    if (component.componentName === 'Journey') {
        const journeyConfig = extractJourneyConfig(props, errors, component.nodeId);
        if (journeyConfig) {
            normalized.journeyType = journeyConfig.journeyType;
            normalized.journeyConfig = journeyConfig;
        }
    }

    return normalized;
}

/**
 * Extract ID from properties
 * Handles both direct 'id' and mapped 'prop0'
 */
function extractId(props: ComponentProperties, nodeId: string): string | null {
    // Priority: id > prop0 > generate from nodeId
    if (props.id && typeof props.id === 'string' && props.id.trim()) {
        return props.id.trim();
    }

    if (props.prop0 && typeof props.prop0 === 'string' && props.prop0.trim()) {
        return props.prop0.trim();
    }

    // Generate ID from nodeId as fallback
    return `component-${nodeId.replace(':', '-')}`;
}

/**
 * Extract section type from properties
 */
function extractSectionType(
    props: ComponentProperties,
    componentName: string
): SectionType {
    // Priority: section_type > prop1 > default
    let sectionType: string | undefined;

    if (props.section_type && typeof props.section_type === 'string') {
        sectionType = props.section_type.toLowerCase().trim();
    } else if (props.prop1 && typeof props.prop1 === 'string') {
        sectionType = props.prop1.toLowerCase().trim();
    }

    // Validate section type
    const validTypes: SectionType[] = ['main-carousel', 'slide-panel', 'modal', 'slide', 'full'];

    if (sectionType && validTypes.includes(sectionType as SectionType)) {
        return sectionType as SectionType;
    }

    // Default based on component type
    return componentName === 'Journey' ? 'main-carousel' : 'slide';
}

/**
 * Extract sectionHome flag
 */
function extractSectionHome(props: ComponentProperties): boolean {
    // Priority: sectionHome > prop2 > false
    if (typeof props.sectionHome === 'boolean') {
        return props.sectionHome;
    }

    if (typeof props.prop2 === 'boolean') {
        return props.prop2;
    }

    // Handle string 'true'/'false'
    if (typeof props.prop2 === 'string') {
        return props.prop2.toLowerCase() === 'true';
    }

    return false;
}

/**
 * Extract and normalize homeSection option
 */
function extractHomeSection(
    props: ComponentProperties,
    errors: ValidationError[],
    nodeId: string
): string | undefined {
    const rawValue = props.sectionHomeOption;

    if (!rawValue || typeof rawValue !== 'string') {
        errors.push({
            type: 'error',
            message: 'sectionHomeOption is required when sectionHome is true',
            component: nodeId
        });
        return undefined;
    }

    // Normalize to lowercase and trim
    const normalized = rawValue.toLowerCase().trim();

    if (!normalized) {
        errors.push({
            type: 'error',
            message: 'sectionHomeOption cannot be empty',
            component: nodeId
        });
        return undefined;
    }

    return normalized;
}

/**
 * Extract Journey configuration from properties
 */
function extractJourneyConfig(
    props: ComponentProperties,
    errors: ValidationError[],
    nodeId: string
): JourneyConfig | null {
    const journeyType = props.journeyOption as JourneyType;

    if (!journeyType || !['CoreJourney', 'AssistJourney'].includes(journeyType)) {
        errors.push({
            type: 'error',
            message: 'Journey component must have a valid journeyOption',
            component: nodeId
        });
        return null;
    }

    const config: JourneyConfig = {
        journeyType,
        debug: false,
        useMockMode: true
    };

    // Extract journey-specific properties based on type
    if (journeyType === 'CoreJourney') {
        // CoreJourney uses prop3 for customerId
        if (props.prop3 && typeof props.prop3 === 'string') {
            config.customerId = props.prop3;
        }
    } else if (journeyType === 'AssistJourney') {
        // AssistJourney uses prop3 for TTS, prop4 for Gemini
        if (typeof props.prop3 === 'boolean' || typeof props.prop4 === 'boolean') {
            config.enableTTS = coerceToBoolean(props.prop3);
            config.enableGemini = coerceToBoolean(props.prop4);
        }

        // Check for prop5 (additional config)
        if (typeof props.prop5 === 'boolean') {
            // Future: additional AssistJourney config
        }
    }

    return config;
}

/**
 * Coerce value to boolean
 */
function coerceToBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return false;
}

/**
 * Validate normalized components for business logic
 */
export function validateNormalizedComponents(
    components: NormalizedComponent[]
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for home section conflicts
    const homeSections = new Map<string, string[]>();

    for (const component of components) {
        if (component.isHome && component.homeSection) {
            const key = `${component.sectionType}-${component.homeSection}`;
            if (!homeSections.has(key)) {
                homeSections.set(key, []);
            }
            homeSections.get(key)!.push(component.id);
        }
    }

    // Report duplicates (warnings, not errors - last one wins)
    for (const [key, ids] of homeSections.entries()) {
        if (ids.length > 1) {
            errors.push({
                type: 'warning',
                message: `Multiple components targeting same home section: ${key}. Components: ${ids.join(', ')}. Last one will be used.`
            });
        }
    }

    // Validate Journey configs
    for (const component of components) {
        if (component.componentType === 'Journey' && !component.journeyConfig) {
            errors.push({
                type: 'error',
                message: `Journey component missing configuration`,
                component: component.id
            });
        }
    }

    return errors;
}

/**
 * Helper function to clean component properties
 * Removes legacy properties with # suffix
 */
export function cleanProperties(props: ComponentProperties): ComponentProperties {
    const cleaned: ComponentProperties = {};

    for (const [key, value] of Object.entries(props)) {
        // Skip properties with # suffix (legacy Figma properties)
        if (!key.includes('#')) {
            cleaned[key] = value;
        }
    }

    return cleaned;
}

/**
 * Generate a summary of parsed components
 */
export function generateParseSummary(normalized: NormalizedComponent[]): string {
    const total = normalized.length;
    const journeys = normalized.filter(c => c.componentType === 'Journey').length;
    const screenBuilders = normalized.filter(c => c.componentType === 'ScreenBuilder_frame').length;
    const homes = normalized.filter(c => c.isHome).length;
    const children = normalized.filter(c => !c.isHome).length;

    return `Parsed ${total} components: ${journeys} Journeys, ${screenBuilders} ScreenBuilders. ${homes} home sections, ${children} child screens.`;
}