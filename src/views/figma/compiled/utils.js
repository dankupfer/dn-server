export function showFeedback(message, type = 'info') {
    const output = document.getElementById('output');
    if (!output)
        return;
    output.style.display = 'block';
    output.className = `output ${type}`;
    output.textContent = message;
}
export function showSaveFeedback() {
    const output = document.getElementById('output');
    if (!output)
        return;
    output.style.display = 'block';
    output.className = 'output success';
    output.textContent = '✅ Auto-saved';
    setTimeout(() => {
        output.style.display = 'none';
    }, 1000);
}
export function hideFeedback() {
    const output = document.getElementById('output');
    if (!output)
        return;
    output.style.display = 'none';
}
export function sendToPlugin(message) {
    parent.postMessage({ pluginMessage: message }, '*');
}
