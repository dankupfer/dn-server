// src/views/figma/scrip.js

// Set default date values
const today = new Date();
const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

document.getElementById('from-date').value = oneYearAgo.toISOString().split('T')[0];
document.getElementById('to-date').value = today.toISOString().split('T')[0];

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');

    // Activate selected button
    event.target.classList.add('active');

    // Request selection update when switching to configure tab
    if (tabName === 'configure') {
        parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');
    }
}

// Button references
const createComponentsButton = document.getElementById('create-components');
const generateButton = document.getElementById('generate');
const closeButton = document.getElementById('close');
const output = document.getElementById('output');
const moduleNameInput = document.getElementById('module-name');
const folderPathInput = document.getElementById('folder-path');
const targetSectionSelect = document.getElementById('target-section');
const generateCustomerButton = document.getElementById('generate-customer');

// ScreenBuilder: Create components
createComponentsButton.onclick = () => {
    console.log('Create components button clicked');
    parent.postMessage({ pluginMessage: { type: 'create-components' } }, '*');
};

// ScreenBuilder: Generate files
generateButton.onclick = () => {
    const moduleName = moduleNameInput.value.trim();
    const folderPath = folderPathInput.value.trim();
    const targetSection = targetSectionSelect.value;
    const routerName = document.getElementById('router-name').value.trim();

    if (!moduleName) {
        alert('Please enter a module name');
        return;
    }

    if (!targetSection) {
        alert('Please select a target section');
        return;
    }

    console.log('Generate button clicked', { moduleName, folderPath, targetSection, routerName });
    parent.postMessage({
        pluginMessage: {
            type: 'generate-files',
            moduleName: moduleName,
            folderPath: folderPath || undefined,
            targetSection: targetSection,
            routerName: routerName || undefined
        }
    }, '*');
};

// CustomerBuilder: Generate customer
generateCustomerButton.onclick = () => {
    const customerName = document.getElementById('customer-name').value.trim();
    const frescoSegment = document.getElementById('fresco-segment').value;
    const age = document.getElementById('customer-age').value;
    const gender = document.getElementById('customer-gender').value;
    const profession = document.getElementById('customer-profession').value.trim();
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;

    if (!customerName || !frescoSegment || !age || !gender || !profession || !fromDate || !toDate) {
        alert('Please fill in all customer fields');
        return;
    }

    // Show loading state
    generateCustomerButton.disabled = true;
    generateCustomerButton.textContent = 'Generating with AI...';

    output.style.display = 'block';
    output.className = 'output';
    output.textContent = 'Generating customer data with Claude AI...\n\nThis may take a few seconds to create realistic banking data.';

    console.log('Generate customer button clicked', {
        customerName, frescoSegment, age: parseInt(age), gender, profession, fromDate, toDate
    });

    parent.postMessage({
        pluginMessage: {
            type: 'generate-customer',
            customerData: {
                customerName,
                frescoSegment,
                age: parseInt(age),
                gender,
                profession,
                fromDate,
                toDate
            }
        }
    }, '*');
};

// Close plugin
closeButton.onclick = () => {
    parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
};

// Configure tab - Dynamic form based on selection
let currentSelection = null;

// Update the config form based on current selection
function updateConfigForm() {
    const noSelection = document.getElementById('no-selection');
    const configForm = document.getElementById('config-form');

    if (!currentSelection || !currentSelection.componentName) {
        noSelection.style.display = 'block';
        configForm.style.display = 'none';
        return;
    }

    noSelection.style.display = 'none';
    configForm.style.display = 'block';

    // Build form based on component type
    const formHTML = buildFormForComponent(currentSelection);
    configForm.innerHTML = formHTML;
}

// Build form HTML based on component type
function buildFormForComponent(selection) {
    const { componentName, properties } = selection;

    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;

    // App_frame
    if (componentName === 'App_frame') {
        html += `
      <div class="input-group">
        <label for="config-brand">Brand:</label>
        <select id="config-brand" onchange="autoSave()">
          <option value="BrandA" ${properties.brand === 'BrandA' ? 'selected' : ''}>Brand A</option>
          <option value="BrandB" ${properties.brand === 'BrandB' ? 'selected' : ''}>Brand B</option>
        </select>
      </div>
      <div class="input-group">
        <label for="config-mode">Mode:</label>
        <select id="config-mode" onchange="autoSave()">
          <option value="light" ${properties.mode === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${properties.mode === 'dark' ? 'selected' : ''}>Dark</option>
        </select>
      </div>
      <div class="input-group">
        <label for="config-apiBase">API Base URL:</label>
        <input type="text" id="config-apiBase" value="${properties.apiBase || 'http://localhost:3001'}" onchange="autoSave()">
      </div>
    `;
    }

    // DN_Frame_Journey_Core
    else if (componentName === 'DN_Frame_Journey_Core') {
        html += `
      <div class="input-group">
        <label for="config-customerId">Customer ID:</label>
        <input type="text" id="config-customerId" value="${properties.customerId || 'customer-1'}" onchange="autoSave()">
      </div>
    `;
    }

    // DN_Frame_Journey_Assist
    else if (componentName === 'DN_Frame_Journey_Assist') {
        html += `
      <div class="input-group">
        <label>
          <input type="checkbox" id="config-tts" ${properties.tts ? 'checked' : ''} onchange="autoSave()">
          Enable TTS (Text-to-Speech)
        </label>
      </div>
      <div class="input-group">
        <label>
          <input type="checkbox" id="config-gemini" ${properties.gemini ? 'checked' : ''} onchange="autoSave()">
          Enable Gemini AI
        </label>
      </div>
    `;
    }

    // Other frames
    else {
        html += `<p>No configurable properties for this component.</p>`;
    }

    // Remove the save button - auto-save handles it!
    html += `</div>`;

    return html;
}

// Auto-save properties when any input changes
function autoSave() {
    if (!currentSelection) return;

    const componentName = currentSelection.componentName;
    const updatedProperties = {};

    // Collect values based on component type
    if (componentName === 'App_frame') {
        updatedProperties.brand = document.getElementById('config-brand').value;
        updatedProperties.mode = document.getElementById('config-mode').value;
        updatedProperties.apiBase = document.getElementById('config-apiBase').value;
    } else if (componentName === 'DN_Frame_Journey_Core') {
        updatedProperties.customerId = document.getElementById('config-customerId').value;
    } else if (componentName === 'DN_Frame_Journey_Assist') {
        updatedProperties.tts = document.getElementById('config-tts').checked;
        updatedProperties.gemini = document.getElementById('config-gemini').checked;
    }

    // Send to plugin
    parent.postMessage({
        pluginMessage: {
            type: 'update-properties',
            properties: updatedProperties
        }
    }, '*');

    // Show brief feedback
    showSaveFeedback();
}

// Show brief "Saved" feedback
function showSaveFeedback() {
    output.style.display = 'block';
    output.className = 'output success';
    output.textContent = '✅ Auto-saved';

    // Hide after 1 second
    setTimeout(() => {
        output.style.display = 'none';
    }, 1000);
}

// Keep the old saveProperties function for backwards compatibility (if needed)
function saveProperties() {
    autoSave();
}

// Listen for messages from the plugin
window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    console.log('UI received message:', msg);

    if (msg.type === 'components-created') {
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `✅ ${msg.data.message}\n\nCreated components:\n${msg.data.components.join('\n')}`;
    }

    if (msg.type === 'files-generated') {
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `✅ ${msg.data.message}\n\nFiles created:\n${msg.data.files.join('\n')}\n\nModule: ${msg.data.moduleName} (${msg.data.moduleId})`;
    }

    if (msg.type === 'customer-generated') {
        // Reset button state
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';

        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `Customer Generated!\n\nName: ${msg.data.customerName}\nID: ${msg.data.customerId}\nFile: ${msg.data.filePath}`;
    }

    if (msg.type === 'selection-changed') {
        currentSelection = msg.data;
        updateConfigForm();
    }

    if (msg.type === 'properties-updated') {
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = '✅ Properties updated successfully!';
    }

    if (msg.type === 'error') {
        // Reset button state on error too
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';

        output.style.display = 'block';
        output.className = 'output error';
        output.textContent = msg.data.message;
    }
};