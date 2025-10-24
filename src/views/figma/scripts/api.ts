// src/views/figma/scripts/api.ts
// Handles all API calls to the server

const API_BASE_URL = 'http://localhost:3001/api/figma';

interface ComponentTypeMetadata {
    componentType: string;
    label: string;
    fieldCount: number;
}

interface FormField {
    name: string;
    genericKey: string;
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

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Fetch available component types
 */
export async function fetchComponentTypes(): Promise<ComponentTypeMetadata[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/component-types`);
        const result = await response.json() as ApiResponse<ComponentTypeMetadata[]>;

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch component types');
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching component types:', error);
        throw error;
    }
}

/**
 * Fetch form configuration for a component type
 */
export async function fetchFormConfig(componentType: string): Promise<FormConfig> {
    try {
        const response = await fetch(`${API_BASE_URL}/form-config/${componentType}`);
        const result = await response.json() as ApiResponse<FormConfig>;

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch form config');
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching form config:', error);
        throw error;
    }
}