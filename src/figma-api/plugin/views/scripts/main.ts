// src/figma-api/views/scripts/main.ts
// Main entry point - tab switching, initialization, message handling

import { initGenerateTab, handleComponentsCreated, handleFilesGenerated, handleCustomerGenerated, handleCustomerError } from './generate';
import { initConfigureTab, updateSelection, autoSave } from './configure';
import { initExportTab, updateExportSelection, updateAppFrameConfig, handleFullAppExportComplete, handleSingleComponentExportComplete } from './export';
import { showFeedback, sendToPlugin } from './utils';

/**
 * Initialize the application
 */
function init() {
    console.log('Figma Plugin UI initialised');

    // Initialize all tabs
    initGenerateTab();
    initConfigureTab();
    initExportTab();

    // Set up tab buttons
    setupTabButtons();

    // Set up close button
    const closeButton = document.getElementById('close');
    if (closeButton) {
        closeButton.onclick = () => {
            sendToPlugin({ type: 'close' });
        };
    }

    // Listen for messages from Figma plugin
    setupMessageListener();

    // Request initial selection
    sendToPlugin({ type: 'get-selection' });
}

/**
 * Set up tab button click handlers
 */
function setupTabButtons() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const tabName = (event.target as HTMLElement).getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName, event.target as HTMLElement);
            }
        });
    });
}

/**
 * Tab switching
 */
function switchTab(tabName: string, targetButton: HTMLElement) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Activate selected button
    targetButton.classList.add('active');

    // Request selection update and trigger tab-specific actions
    if (tabName === 'configure' || tabName === 'export') {
        sendToPlugin({ type: 'get-selection' });
    }
    
    // Trigger export form update when switching to export tab
    if (tabName === 'export') {
        // Request fresh App_frame config every time we switch to Export tab
        sendToPlugin({ type: 'get-app-frame-config' });
        
        // Import updateExportSelection at module level to access it here
        // For now, trigger it with stored selection or null
        const lastSelection = (window as any).lastSelection || null;
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            updateExportSelection(lastSelection);
        }, 10);
    }
}

/**
 * Set up message listener for Figma plugin messages
 */
function setupMessageListener() {
    window.onmessage = (event) => {
        const msg = event.data.pluginMessage;
        console.log('UI received message ::**::', msg);

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
                // Store selection globally for tab switching
                (window as any).lastSelection = msg.data;
                // Update both configure and export tabs with selection
                updateSelection(msg.data);
                updateExportSelection(msg.data);
                break;

            case 'app-frame-config':
                updateAppFrameConfig(msg.data);
                break;

            case 'properties-updated':
                showFeedback('✅ Properties updated successfully!', 'success');
                break;

            case 'plugin-data-cleared':
                showFeedback(`✅ Cleared plugin data from ${msg.data.count} component(s)`, 'success');
                break;

            case 'full-app-exported':
                handleFullAppExportComplete(msg.data);
                break;

            case 'single-component-exported':
                handleSingleComponentExportComplete(msg.data);
                break;

            case 'error':
                handleCustomerError();
                showFeedback(msg.data.message, 'error');
                break;
        }
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}