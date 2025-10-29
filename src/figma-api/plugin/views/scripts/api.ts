// src/figma-api/views/scripts/api.ts
// API communication layer

const API_BASE = 'http://localhost:3001';

/**
 * Fetch form configuration for any component
 * GENERIC - works for all component types
 */
export async function fetchFormConfig(params: {
    componentName: string;
    currentValues?: Record<string, any>;
    selectedConfiguration?: string;
}): Promise<any> {
    const response = await fetch(`${API_BASE}/api/figma/plugin/form-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch form config: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch conditional rules - server tells us what to update
 */
export async function fetchConditionalRules(
    componentName: string,
    changedFieldKey: string | null,
    currentValues: Record<string, any>
): Promise<any> {
    const response = await fetch(`${API_BASE}/api/figma/plugin/conditional-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            componentName,
            changedFieldKey,
            currentValues
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch conditional rules: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch conditional options for a field
 */
export async function fetchConditionalOptions(
    componentName: string,
    fieldKey: string,
    dependentFieldKey: string,
    dependentFieldValue: any
): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/figma/conditional-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            componentName,
            fieldKey,
            dependentFieldKey,
            dependentFieldValue
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch conditional options: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Legacy - Get field definitions
 */
export async function fetchcommonDefinitions(): Promise<any> {
    // No longer needed - definitions handled server-side
    return {};
}

/**
 * Legacy - Get journey options
 */
export async function fetchJourneyOptions(): Promise<any[]> {
    // Still useful for variant selectors
    const response = await fetch(`${API_BASE}/api/figma/definitions/journeys`);
    if (!response.ok) {
        throw new Error(`Failed to fetch journey options: ${response.statusText}`);
    }
    return response.json();
}