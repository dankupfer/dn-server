// src/views/figma/scripts/api.ts
// Handles all API calls to the server

const API_BASE_URL = 'http://localhost:3001/api/figma';

interface JourneyOptionMetadata {
    journeyOption: string;
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
    journeyOption: string;
    title: string;
    fields: FormField[];
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Fetch available journey options
 */
export async function fetchJourneyOptions(): Promise<JourneyOptionMetadata[]> {
    try {
        console.log('📡 Fetching journey options from:', `${API_BASE_URL}/journey-options`);
        const response = await fetch(`${API_BASE_URL}/journey-options`);
        const result = await response.json() as ApiResponse<JourneyOptionMetadata[]>;

        console.log('📦 Server response:', result);

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch journey options');
        }

        return result.data;
    } catch (error) {
        console.error('❌ Error fetching journey options:', error);
        throw error;
    }
}

/**
 * Fetch form configuration for a journey option
 */
export async function fetchFormConfig(journeyOption: string): Promise<FormConfig> {
    try {
        console.log('🔗 Fetching form config for:', journeyOption);
        const response = await fetch(`${API_BASE_URL}/form-config/${journeyOption}`);
        const result = await response.json() as ApiResponse<FormConfig>;

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch form config');
        }

        return result.data;
    } catch (error) {
        console.error('❌ Error fetching form config:', error);
        throw error;
    }
}

/**
 * Fetch field definitions from server
 */
export async function fetchFieldDefinitions(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/field-definitions`);
    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch field definitions');
    }

    return result.data;
}