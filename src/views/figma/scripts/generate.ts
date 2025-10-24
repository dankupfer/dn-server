// src/views/figma/scripts/generate.ts
// Generate tab - ScreenBuilder and CustomerBuilder logic

import { showFeedback, sendToPlugin } from './utils';

/**
 * Initialize generate tab
 */
export function initGenerateTab() {
    // Set default date values
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    const fromDateInput = document.getElementById('from-date') as HTMLInputElement;
    const toDateInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromDateInput) fromDateInput.value = oneYearAgo.toISOString().split('T')[0];
    if (toDateInput) toDateInput.value = today.toISOString().split('T')[0];

    // Set up button handlers
    setupScreenBuilderHandlers();
    setupCustomerBuilderHandlers();
}

/**
 * Set up ScreenBuilder button handlers
 */
function setupScreenBuilderHandlers() {
    const createComponentsButton = document.getElementById('create-components');
    const generateButton = document.getElementById('generate');

    if (createComponentsButton) {
        createComponentsButton.onclick = () => {
            console.log('Create components button clicked');
            sendToPlugin({ type: 'create-components' });
        };
    }

    if (generateButton) {
        generateButton.onclick = () => {
            const moduleNameInput = document.getElementById('module-name') as HTMLInputElement;
            const folderPathInput = document.getElementById('folder-path') as HTMLInputElement;
            const targetSectionSelect = document.getElementById('target-section') as HTMLSelectElement;
            const routerNameInput = document.getElementById('router-name') as HTMLInputElement;

            const moduleName = moduleNameInput?.value.trim();
            const folderPath = folderPathInput?.value.trim();
            const targetSection = targetSectionSelect?.value;
            const routerName = routerNameInput?.value.trim();

            if (!moduleName) {
                alert('Please enter a module name');
                return;
            }

            if (!targetSection) {
                alert('Please select a target section');
                return;
            }

            console.log('Generate button clicked', { moduleName, folderPath, targetSection, routerName });
            sendToPlugin({
                type: 'generate-files',
                moduleName: moduleName,
                folderPath: folderPath || undefined,
                targetSection: targetSection,
                routerName: routerName || undefined
            });
        };
    }
}

/**
 * Set up CustomerBuilder button handlers
 */
function setupCustomerBuilderHandlers() {
    const generateCustomerButton = document.getElementById('generate-customer') as HTMLButtonElement;

    if (generateCustomerButton) {
        generateCustomerButton.onclick = () => {
            const customerNameInput = document.getElementById('customer-name') as HTMLInputElement;
            const frescoSegmentSelect = document.getElementById('fresco-segment') as HTMLSelectElement;
            const ageInput = document.getElementById('customer-age') as HTMLInputElement;
            const genderSelect = document.getElementById('customer-gender') as HTMLSelectElement;
            const professionInput = document.getElementById('customer-profession') as HTMLInputElement;
            const fromDateInput = document.getElementById('from-date') as HTMLInputElement;
            const toDateInput = document.getElementById('to-date') as HTMLInputElement;

            const customerName = customerNameInput?.value.trim();
            const frescoSegment = frescoSegmentSelect?.value;
            const age = ageInput?.value;
            const gender = genderSelect?.value;
            const profession = professionInput?.value.trim();
            const fromDate = fromDateInput?.value;
            const toDate = toDateInput?.value;

            if (!customerName || !frescoSegment || !age || !gender || !profession || !fromDate || !toDate) {
                alert('Please fill in all customer fields');
                return;
            }

            // Show loading state
            generateCustomerButton.disabled = true;
            generateCustomerButton.textContent = 'Generating with AI...';

            showFeedback('Generating customer data with Claude AI...\n\nThis may take a few seconds to create realistic banking data.', 'info');

            console.log('Generate customer button clicked', {
                customerName, frescoSegment, age: parseInt(age), gender, profession, fromDate, toDate
            });

            sendToPlugin({
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
            });
        };
    }
}

/**
 * Handle components created message
 */
export function handleComponentsCreated(data: any) {
    showFeedback(`✅ ${data.message}\n\nCreated components:\n${data.components.join('\n')}`, 'success');
}

/**
 * Handle files generated message
 */
export function handleFilesGenerated(data: any) {
    showFeedback(`✅ ${data.message}\n\nFiles created:\n${data.files.join('\n')}\n\nModule: ${data.moduleName} (${data.moduleId})`, 'success');
}

/**
 * Handle customer generated message
 */
export function handleCustomerGenerated(data: any) {
    const generateCustomerButton = document.getElementById('generate-customer') as HTMLButtonElement;

    // Reset button state
    if (generateCustomerButton) {
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';
    }

    showFeedback(`Customer Generated!\n\nName: ${data.customerName}\nID: ${data.customerId}\nFile: ${data.filePath}`, 'success');
}

/**
 * Handle error in customer generation
 */
export function handleCustomerError() {
    const generateCustomerButton = document.getElementById('generate-customer') as HTMLButtonElement;

    // Reset button state
    if (generateCustomerButton) {
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';
    }
}