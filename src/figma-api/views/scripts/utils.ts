// src/figma-api/views/scripts/utils.ts
// Shared utility functions

/**
 * Show feedback message in the output area
 */
export function showFeedback(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const output = document.getElementById('output');
    if (!output) return;

    output.style.display = 'block';
    output.className = `output ${type}`;
    output.textContent = message;
}

/**
 * Show brief auto-save feedback
 */
export function showSaveFeedback() {
    const output = document.getElementById('output');
    if (!output) return;

    output.style.display = 'block';
    output.className = 'output success';
    output.textContent = '✅ Auto-saved';

    // Hide after 1 second
    setTimeout(() => {
        output.style.display = 'none';
    }, 1000);
}

/**
 * Hide feedback message
 */
export function hideFeedback() {
    const output = document.getElementById('output');
    if (!output) return;

    output.style.display = 'none';
}

/**
 * Send message to Figma plugin
 */
export function sendToPlugin(message: any) {
    parent.postMessage({ pluginMessage: message }, '*');
}