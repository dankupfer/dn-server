// // src/views/figma/script.js

// // Set default date values
// const today = new Date();
// const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

// document.getElementById('from-date').value = oneYearAgo.toISOString().split('T')[0];
// document.getElementById('to-date').value = today.toISOString().split('T')[0];

// // Tab switching
// function switchTab(tabName) {
//     // Hide all tabs
//     document.querySelectorAll('.tab-content').forEach(tab => {
//         tab.classList.remove('active');
//     });

//     // Remove active from all buttons
//     document.querySelectorAll('.tab-button').forEach(btn => {
//         btn.classList.remove('active');
//     });

//     // Show selected tab
//     document.getElementById(tabName + '-tab').classList.add('active');

//     // Activate selected button
//     event.target.classList.add('active');

//     // Request selection update when switching to configure tab
//     if (tabName === 'configure') {
//         parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');
//     }
// }

// // Button references
// const createComponentsButton = document.getElementById('create-components');
// const generateButton = document.getElementById('generate');
// const closeButton = document.getElementById('close');
// const output = document.getElementById('output');
// const moduleNameInput = document.getElementById('module-name');
// const folderPathInput = document.getElementById('folder-path');
// const targetSectionSelect = document.getElementById('target-section');
// const generateCustomerButton = document.getElementById('generate-customer');

// // ScreenBuilder: Create components
// createComponentsButton.onclick = () => {
//     console.log('Create components button clicked');
//     parent.postMessage({ pluginMessage: { type: 'create-components' } }, '*');
// };

// // ScreenBuilder: Generate files
// generateButton.onclick = () => {
//     const moduleName = moduleNameInput.value.trim();
//     const folderPath = folderPathInput.value.trim();
//     const targetSection = targetSectionSelect.value;
//     const routerName = document.getElementById('router-name').value.trim();

//     if (!moduleName) {
//         alert('Please enter a module name');
//         return;
//     }

//     if (!targetSection) {
//         alert('Please select a target section');
//         return;
//     }

//     console.log('Generate button clicked', { moduleName, folderPath, targetSection, routerName });
//     parent.postMessage({
//         pluginMessage: {
//             type: 'generate-files',
//             moduleName: moduleName,
//             folderPath: folderPath || undefined,
//             targetSection: targetSection,
//             routerName: routerName || undefined
//         }
//     }, '*');
// };

// // CustomerBuilder: Generate customer
// generateCustomerButton.onclick = () => {
//     const customerName = document.getElementById('customer-name').value.trim();
//     const frescoSegment = document.getElementById('fresco-segment').value;
//     const age = document.getElementById('customer-age').value;
//     const gender = document.getElementById('customer-gender').value;
//     const profession = document.getElementById('customer-profession').value.trim();
//     const fromDate = document.getElementById('from-date').value;
//     const toDate = document.getElementById('to-date').value;

//     if (!customerName || !frescoSegment || !age || !gender || !profession || !fromDate || !toDate) {
//         alert('Please fill in all customer fields');
//         return;
//     }

//     // Show loading state
//     generateCustomerButton.disabled = true;
//     generateCustomerButton.textContent = 'Generating with AI...';

//     output.style.display = 'block';
//     output.className = 'output';
//     output.textContent = 'Generating customer data with Claude AI...\n\nThis may take a few seconds to create realistic banking data.';

//     console.log('Generate customer button clicked', {
//         customerName, frescoSegment, age: parseInt(age), gender, profession, fromDate, toDate
//     });

//     parent.postMessage({
//         pluginMessage: {
//             type: 'generate-customer',
//             customerData: {
//                 customerName,
//                 frescoSegment,
//                 age: parseInt(age),
//                 gender,
//                 profession,
//                 fromDate,
//                 toDate
//             }
//         }
//     }, '*');
// };

// // Close plugin
// closeButton.onclick = () => {
//     parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
// };

// // Configure tab - Dynamic form based on selection
// let currentSelection = null;

// // Update the config form based on current selection
// function updateConfigForm() {
//     const noSelection = document.getElementById('no-selection');
//     const configForm = document.getElementById('config-form');

//     if (!currentSelection || !currentSelection.componentName) {
//         noSelection.style.display = 'block';
//         configForm.style.display = 'none';
//         return;
//     }

//     noSelection.style.display = 'none';
//     configForm.style.display = 'block';

//     // Build form based on component type
//     const formHTML = buildFormForComponent(currentSelection);
//     configForm.innerHTML = formHTML;
// }

// // Build form HTML based on component type - NOW DYNAMIC!
// async function buildFormForComponent(selection) {
//     const { componentName, properties } = selection;

//     let html = `<div class="section">`;
//     html += `<h2>${componentName}</h2>`;

//     // Check if this is a Journey component (uses dynamic forms from server)
//     if (componentName === 'Journey') {
//         const journeyType = properties.Type || 'AccountCard'; // Default to AccountCard

//         try {
//             // Fetch form configuration from server
//             const response = await fetch(`http://localhost:3001/api/figma/form-config/${journeyType}`);
//             const result = await response.json();

//             if (result.success && result.data) {
//                 const formConfig = result.data;

//                 // First, add Journey Type selector (to switch between component types)
//                 html += await buildJourneyTypeSelector(properties);

//                 // Then add dynamic fields based on the selected type
//                 html += buildDynamicFields(formConfig.fields, properties);
//             } else {
//                 html += `<p class="error">Failed to load form configuration for ${journeyType}</p>`;
//             }
//         } catch (error) {
//             console.error('Error fetching form config:', error);
//             html += `<p class="error">Error loading form: ${error.message}</p>`;
//         }
//     }
//     // Keep existing hardcoded forms for App_frame and other components
//     else if (componentName === 'App_frame') {
//         html += buildAppFrameForm(properties);
//     }
//     else if (componentName === 'ScreenBuilder_frame') {
//         html += buildScreenBuilderForm(properties);
//     }
//     else if (componentName === 'Modal_frame') {
//         html += buildModalForm(properties);
//     }
//     else {
//         html += `<p>No configurable properties for this component.</p>`;
//     }

//     html += `</div>`;
//     return html;
// }

// // Build Journey Type selector to switch between component types
// async function buildJourneyTypeSelector(properties) {
//     try {
//         // Fetch available component types from server
//         const response = await fetch('http://localhost:3001/api/figma/component-types');
//         const result = await response.json();

//         if (!result.success || !result.data) {
//             return '<p class="error">Failed to load component types</p>';
//         }

//         const componentTypes = result.data;
//         const currentType = properties.Type || 'AccountCard';

//         let html = `
//             <div class="input-group">
//                 <label for="config-Type">Component Type</label>
//                 <small class="description">Select the type of component to configure</small>
//                 <select id="config-Type" onchange="handleTypeChange()">
//         `;

//         componentTypes.forEach(type => {
//             html += `<option value="${type.componentType}" ${currentType === type.componentType ? 'selected' : ''}>
//                 ${type.label} (${type.fieldCount} properties)
//             </option>`;
//         });

//         html += `
//                 </select>
//             </div>
//         `;

//         return html;
//     } catch (error) {
//         console.error('Error building type selector:', error);
//         return '<p class="error">Error loading component types</p>';
//     }
// }

// // Build dynamic form fields from server configuration
// function buildDynamicFields(fields, properties) {
//     let html = '';

//     fields.forEach(field => {
//         const value = properties[field.genericKey] || field.defaultValue;

//         html += `<div class="input-group">`;
//         html += `<label for="config-${field.genericKey}">${field.label}</label>`;

//         if (field.type === 'text') {
//             html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
//         } else if (field.type === 'checkbox') {
//             html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? 'checked' : ''} onchange="autoSave()">`;
//         } else if (field.type === 'select' && field.options) {
//             html += `<select id="config-${field.genericKey}" onchange="autoSave()">`;
//             field.options.forEach(option => {
//                 html += `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
//             });
//             html += `</select>`;
//         }

//         html += `</div>`;
//     });

//     return html;
// }

// // Keep existing hardcoded form builders for other component types
// function buildAppFrameForm(properties) {
//     return `
//         <div class="input-group">
//             <label for="config-brand">Brand</label>
//             <small class="description">Brand theme to use (BrandA, BrandB)</small>
//             <select id="config-brand" onchange="autoSave()">
//                 <option value="BrandA" ${properties.brand === 'BrandA' ? 'selected' : ''}>Brand A</option>
//                 <option value="BrandB" ${properties.brand === 'BrandB' ? 'selected' : ''}>Brand B</option>
//             </select>
//         </div>
//         <div class="input-group">
//             <label for="config-mode">Theme Mode</label>
//             <small class="description">Light or dark theme mode</small>
//             <select id="config-mode" onchange="autoSave()">
//                 <option value="light" ${properties.mode === 'light' ? 'selected' : ''}>Light</option>
//                 <option value="dark" ${properties.mode === 'dark' ? 'selected' : ''}>Dark</option>
//             </select>
//         </div>
//         <div class="input-group">
//             <label for="config-apiBase">API Base URL</label>
//             <small class="description">Base URL for API endpoints</small>
//             <input type="text" id="config-apiBase" value="${properties.apiBase || 'http://localhost:3001'}" onchange="autoSave()">
//         </div>
//     `;
// }

// function buildScreenBuilderForm(properties) {
//     return `
//         <div class="input-group">
//             <label for="config-id">Screen ID</label>
//             <small class="description">Unique identifier for this screen</small>
//             <input type="text" id="config-id" value="${properties.id || 'screen-1'}" onchange="autoSave()">
//         </div>
//         <div class="input-group">
//             <label for="config-section_type">Section Type</label>
//             <small class="description">Where this screen appears: top, bottom, or modal</small>
//             <select id="config-section_type" onchange="autoSave()">
//                 <option value="top" ${properties.section_type === 'top' ? 'selected' : ''}>Top</option>
//                 <option value="bottom" ${properties.section_type === 'bottom' ? 'selected' : ''}>Bottom</option>
//                 <option value="modal" ${properties.section_type === 'modal' ? 'selected' : ''}>Modal</option>
//             </select>
//         </div>
//     `;
// }

// function buildModalForm(properties) {
//     return `
//         <div class="input-group">
//             <label for="config-id">Modal ID</label>
//             <small class="description">Unique identifier for this modal</small>
//             <input type="text" id="config-id" value="${properties.id || 'modal-1'}" onchange="autoSave()">
//         </div>
//         <div class="input-group">
//             <label for="config-section_type">Section Type</label>
//             <small class="description">Where this modal appears: top, bottom, or modal</small>
//             <select id="config-section_type" onchange="autoSave()">
//                 <option value="top" ${properties.section_type === 'top' ? 'selected' : ''}>Top</option>
//                 <option value="bottom" ${properties.section_type === 'bottom' ? 'selected' : ''}>Bottom</option>
//                 <option value="modal" ${properties.section_type === 'modal' ? 'selected' : ''}>Modal</option>
//             </select>
//         </div>
//     `;
// }

// // Auto-save properties when any input changes
// function autoSave() {
//     if (!currentSelection) return;

//     const componentName = currentSelection.componentName;
//     const updatedProperties = {};

//     // Collect values based on component type
//     if (componentName === 'App_frame') {
//         updatedProperties.brand = document.getElementById('config-brand').value;
//         updatedProperties.mode = document.getElementById('config-mode').value;
//         updatedProperties.apiBase = document.getElementById('config-apiBase').value;
//     } else if (componentName === 'Journey') {
//         updatedProperties.Type = document.getElementById('config-Type').value;

//         const prop0 = document.getElementById('config-prop0');
//         const prop1 = document.getElementById('config-prop1');
//         const prop2 = document.getElementById('config-prop2');
//         const prop3 = document.getElementById('config-prop3');
//         const prop4 = document.getElementById('config-prop4');

//         if (prop0) updatedProperties.prop0 = prop0.value;
//         if (prop1) updatedProperties.prop1 = prop1.value;

//         if (updatedProperties.Type === 'CoreJourney') {
//             if (prop2) updatedProperties.prop2 = prop2.value;
//         } else if (updatedProperties.Type === 'AssistJourney') {
//             if (prop3) updatedProperties.prop3 = prop3.checked;
//             if (prop4) updatedProperties.prop4 = prop4.checked;
//         }
//     } else if (componentName === 'ScreenBuilder_frame' || componentName === 'Modal_frame') {
//         updatedProperties.id = document.getElementById('config-id').value;
//         updatedProperties.section_type = document.getElementById('config-section_type').value;
//     }

//     // Send to plugin
//     parent.postMessage({
//         pluginMessage: {
//             type: 'update-properties',
//             properties: updatedProperties
//         }
//     }, '*');

//     // Show brief feedback
//     showSaveFeedback();
// }

// // Show brief "Saved" feedback
// function showSaveFeedback() {
//     output.style.display = 'block';
//     output.className = 'output success';
//     output.textContent = '✅ Auto-saved';

//     // Hide after 1 second
//     setTimeout(() => {
//         output.style.display = 'none';
//     }, 1000);
// }

// // Keep the old saveProperties function for backwards compatibility (if needed)
// function saveProperties() {
//     autoSave();
// }

// // Handle Journey Type change - save and rebuild form
// function handleTypeChange() {
//     if (!currentSelection) return;

//     // Get the new Type value
//     const newType = document.getElementById('config-Type').value;
//     console.log('Type changed to:', newType);

//     // Update the Type in currentSelection immediately
//     currentSelection.properties.Type = newType;
//     console.log('Updated currentSelection.properties.Type:', currentSelection.properties.Type);

//     // Save to Figma
//     autoSave();

//     // Rebuild the form to show correct fields
//     console.log('Rebuilding form...');
//     updateConfigForm();
// }

// // Listen for messages from the plugin
// window.onmessage = (event) => {
//     const msg = event.data.pluginMessage;
//     console.log('UI received message:', msg);

//     if (msg.type === 'components-created') {
//         output.style.display = 'block';
//         output.className = 'output success';
//         output.textContent = `✅ ${msg.data.message}\n\nCreated components:\n${msg.data.components.join('\n')}`;
//     }

//     if (msg.type === 'files-generated') {
//         output.style.display = 'block';
//         output.className = 'output success';
//         output.textContent = `✅ ${msg.data.message}\n\nFiles created:\n${msg.data.files.join('\n')}\n\nModule: ${msg.data.moduleName} (${msg.data.moduleId})`;
//     }

//     if (msg.type === 'customer-generated') {
//         // Reset button state
//         generateCustomerButton.disabled = false;
//         generateCustomerButton.textContent = 'Generate Customer';

//         output.style.display = 'block';
//         output.className = 'output success';
//         output.textContent = `Customer Generated!\n\nName: ${msg.data.customerName}\nID: ${msg.data.customerId}\nFile: ${msg.data.filePath}`;
//     }

//     if (msg.type === 'selection-changed') {
//         currentSelection = msg.data;
//         updateConfigForm();
//     }

//     if (msg.type === 'properties-updated') {
//         output.style.display = 'block';
//         output.className = 'output success';
//         output.textContent = '✅ Properties updated successfully!';
//     }

//     if (msg.type === 'error') {
//         // Reset button state on error too
//         generateCustomerButton.disabled = false;
//         generateCustomerButton.textContent = 'Generate Customer';

//         output.style.display = 'block';
//         output.className = 'output error';
//         output.textContent = msg.data.message;
//     }
// };

// // Request initial selection when plugin opens
// parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');