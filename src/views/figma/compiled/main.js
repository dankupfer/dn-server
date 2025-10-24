import { initGenerateTab, handleComponentsCreated, handleFilesGenerated, handleCustomerGenerated, handleCustomerError } from './generate';
import { initConfigureTab, updateSelection } from './configure';
import { showFeedback, sendToPlugin } from './utils';
function init() {
    console.log('Figma Plugin UI initialized');
    initGenerateTab();
    initConfigureTab();
    setupTabButtons();
    const closeButton = document.getElementById('close');
    if (closeButton) {
        closeButton.onclick = () => {
            sendToPlugin({ type: 'close' });
        };
    }
    setupMessageListener();
    sendToPlugin({ type: 'get-selection' });
}
function setupTabButtons() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const tabName = event.target.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName, event.target);
            }
        });
    });
}
function switchTab(tabName, targetButton) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    targetButton.classList.add('active');
    if (tabName === 'configure') {
        sendToPlugin({ type: 'get-selection' });
    }
}
function setupMessageListener() {
    window.onmessage = (event) => {
        const msg = event.data.pluginMessage;
        console.log('UI received message:', msg);
        switch (msg.type) {
            case 'components-created':
                handleComponentsCreated(msg.data);
                break;
            case 'files-generated':
                handleFilesGenerated(msg.data);
                break;
            case 'customer-generated':
                handleCustomerGenerated(msg.data);
                break;
            case 'selection-changed':
                updateSelection(msg.data);
                break;
            case 'properties-updated':
                showFeedback('✅ Properties updated successfully!', 'success');
                break;
            case 'error':
                handleCustomerError();
                showFeedback(msg.data.message, 'error');
                break;
        }
    };
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
