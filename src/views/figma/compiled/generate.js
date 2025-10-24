import { showFeedback, sendToPlugin } from './utils';
export function initGenerateTab() {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    if (fromDateInput)
        fromDateInput.value = oneYearAgo.toISOString().split('T')[0];
    if (toDateInput)
        toDateInput.value = today.toISOString().split('T')[0];
    setupScreenBuilderHandlers();
    setupCustomerBuilderHandlers();
}
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
            const moduleNameInput = document.getElementById('module-name');
            const folderPathInput = document.getElementById('folder-path');
            const targetSectionSelect = document.getElementById('target-section');
            const routerNameInput = document.getElementById('router-name');
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
function setupCustomerBuilderHandlers() {
    const generateCustomerButton = document.getElementById('generate-customer');
    if (generateCustomerButton) {
        generateCustomerButton.onclick = () => {
            const customerNameInput = document.getElementById('customer-name');
            const frescoSegmentSelect = document.getElementById('fresco-segment');
            const ageInput = document.getElementById('customer-age');
            const genderSelect = document.getElementById('customer-gender');
            const professionInput = document.getElementById('customer-profession');
            const fromDateInput = document.getElementById('from-date');
            const toDateInput = document.getElementById('to-date');
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
export function handleComponentsCreated(data) {
    showFeedback(`✅ ${data.message}\n\nCreated components:\n${data.components.join('\n')}`, 'success');
}
export function handleFilesGenerated(data) {
    showFeedback(`✅ ${data.message}\n\nFiles created:\n${data.files.join('\n')}\n\nModule: ${data.moduleName} (${data.moduleId})`, 'success');
}
export function handleCustomerGenerated(data) {
    const generateCustomerButton = document.getElementById('generate-customer');
    if (generateCustomerButton) {
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';
    }
    showFeedback(`Customer Generated!\n\nName: ${data.customerName}\nID: ${data.customerId}\nFile: ${data.filePath}`, 'success');
}
export function handleCustomerError() {
    const generateCustomerButton = document.getElementById('generate-customer');
    if (generateCustomerButton) {
        generateCustomerButton.disabled = false;
        generateCustomerButton.textContent = 'Generate Customer';
    }
}
