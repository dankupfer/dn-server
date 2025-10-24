const API_BASE_URL = 'http://localhost:3001/api/figma';
export async function fetchComponentTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/component-types`);
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch component types');
        }
        return result.data;
    }
    catch (error) {
        console.error('Error fetching component types:', error);
        throw error;
    }
}
export async function fetchFormConfig(componentType) {
    try {
        const response = await fetch(`${API_BASE_URL}/form-config/${componentType}`);
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch form config');
        }
        return result.data;
    }
    catch (error) {
        console.error('Error fetching form config:', error);
        throw error;
    }
}
