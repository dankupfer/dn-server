"use strict";
(() => {
  // src/figma-api/plugin/views/scripts/utils.ts
  function showFeedback(message, type = "info") {
    const output = document.getElementById("output");
    if (!output) return;
    output.style.display = "block";
    output.className = `output ${type}`;
    output.textContent = message;
  }
  function showSaveFeedback() {
    const output = document.getElementById("output");
    if (!output) return;
    output.style.display = "block";
    output.className = "output success";
    output.textContent = "\u2705 Auto-saved";
    setTimeout(() => {
      output.style.display = "none";
    }, 1e3);
  }
  function sendToPlugin(message) {
    parent.postMessage({ pluginMessage: message }, "*");
  }

  // src/figma-api/plugin/views/scripts/generate.ts
  function initGenerateTab() {
    const today = /* @__PURE__ */ new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const fromDateInput = document.getElementById("from-date");
    const toDateInput = document.getElementById("to-date");
    if (fromDateInput) fromDateInput.value = oneYearAgo.toISOString().split("T")[0];
    if (toDateInput) toDateInput.value = today.toISOString().split("T")[0];
    setupScreenBuilderHandlers();
    setupCustomerBuilderHandlers();
  }
  function setupScreenBuilderHandlers() {
    const createComponentsButton = document.getElementById("create-components");
    const generateButton = document.getElementById("generate");
    if (createComponentsButton) {
      createComponentsButton.onclick = () => {
        console.log("Create components button clicked");
        sendToPlugin({ type: "create-components" });
      };
    }
    if (generateButton) {
      generateButton.onclick = () => {
        const moduleNameInput = document.getElementById("module-name");
        const folderPathInput = document.getElementById("folder-path");
        const targetSectionSelect = document.getElementById("target-section");
        const routerNameInput = document.getElementById("router-name");
        const moduleName = moduleNameInput?.value.trim();
        const folderPath = folderPathInput?.value.trim();
        const targetSection = targetSectionSelect?.value;
        const routerName = routerNameInput?.value.trim();
        if (!moduleName) {
          alert("Please enter a module name");
          return;
        }
        if (!targetSection) {
          alert("Please select a target section");
          return;
        }
        console.log("Generate button clicked", { moduleName, folderPath, targetSection, routerName });
        sendToPlugin({
          type: "generate-files",
          moduleName,
          folderPath: folderPath || void 0,
          targetSection,
          routerName: routerName || void 0
        });
      };
    }
  }
  function setupCustomerBuilderHandlers() {
    const generateCustomerButton = document.getElementById("generate-customer");
    if (generateCustomerButton) {
      generateCustomerButton.onclick = () => {
        const customerNameInput = document.getElementById("customer-name");
        const frescoSegmentSelect = document.getElementById("fresco-segment");
        const ageInput = document.getElementById("customer-age");
        const genderSelect = document.getElementById("customer-gender");
        const professionInput = document.getElementById("customer-profession");
        const fromDateInput = document.getElementById("from-date");
        const toDateInput = document.getElementById("to-date");
        const customerName = customerNameInput?.value.trim();
        const frescoSegment = frescoSegmentSelect?.value;
        const age = ageInput?.value;
        const gender = genderSelect?.value;
        const profession = professionInput?.value.trim();
        const fromDate = fromDateInput?.value;
        const toDate = toDateInput?.value;
        if (!customerName || !frescoSegment || !age || !gender || !profession || !fromDate || !toDate) {
          alert("Please fill in all customer fields");
          return;
        }
        generateCustomerButton.disabled = true;
        generateCustomerButton.textContent = "Generating with AI...";
        showFeedback("Generating customer data with Claude AI...\n\nThis may take a few seconds to create realistic banking data.", "info");
        console.log("Generate customer button clicked", {
          customerName,
          frescoSegment,
          age: parseInt(age),
          gender,
          profession,
          fromDate,
          toDate
        });
        sendToPlugin({
          type: "generate-customer",
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
  function handleComponentsCreated(data) {
    showFeedback(`\u2705 ${data.message}

Created components:
${data.components.join("\n")}`, "success");
  }
  function handleFilesGenerated(data) {
    showFeedback(`\u2705 ${data.message}

Files created:
${data.files.join("\n")}

Module: ${data.moduleName} (${data.moduleId})`, "success");
  }
  function handleCustomerGenerated(data) {
    const generateCustomerButton = document.getElementById("generate-customer");
    if (generateCustomerButton) {
      generateCustomerButton.disabled = false;
      generateCustomerButton.textContent = "Generate Customer";
    }
    showFeedback(`Customer Generated!

Name: ${data.customerName}
ID: ${data.customerId}
File: ${data.filePath}`, "success");
  }
  function handleCustomerError() {
    const generateCustomerButton = document.getElementById("generate-customer");
    if (generateCustomerButton) {
      generateCustomerButton.disabled = false;
      generateCustomerButton.textContent = "Generate Customer";
    }
  }

  // src/figma-api/plugin/views/scripts/api.ts
  var API_BASE = "http://localhost:3001";
  async function fetchFormConfig(params) {
    const response = await fetch(`${API_BASE}/api/figma/form-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch form config: ${response.statusText}`);
    }
    return response.json();
  }
  async function fetchConditionalRules(componentName, changedFieldKey, currentValues) {
    const response = await fetch(`${API_BASE}/api/figma/conditional-rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // src/figma-api/plugin/views/scripts/configure.builders.ts
  async function buildFormForComponent(selection) {
    const { componentName, properties } = selection;
    let journeyOption;
    if (properties.journeyOption) {
      journeyOption = properties.journeyOption;
    } else {
      const journeyOptionKey = Object.keys(properties).find(
        (key) => key.startsWith("journeyOption#")
      );
      journeyOption = journeyOptionKey ? properties[journeyOptionKey] : void 0;
    }
    try {
      const formConfig = await fetchFormConfig({
        componentName,
        currentValues: properties,
        selectedConfiguration: journeyOption
      });
      console.log("\u2705 Form config received:", formConfig);
      let html = `<div class="section">`;
      html += `<h2>${formConfig.componentLabel}</h2>`;
      if (formConfig.hasConfigurations && formConfig.configurationField) {
        html += renderConfigurationSelector(formConfig.configurationField);
      }
      formConfig.fields.forEach((field) => {
        html += renderField(field);
      });
      html += `</div>`;
      return html;
    } catch (error) {
      console.error("\u274C Error building form:", error);
      return `
            <div class="section">
                <h2>${componentName}</h2>
                <p class="error">Error loading form: ${error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
        `;
    }
  }
  function renderConfigurationSelector(configurationField) {
    const { key, label, description, options, value } = configurationField;
    let html = `
        <div class="input-group">
            <label for="config-${key}">${label}</label>
    `;
    if (description) {
      html += `<small class="description">${description}</small>`;
    }
    html += `<select id="config-${key}" onchange="handleConfigurationChange()">`;
    options.forEach((option) => {
      html += `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`;
    });
    html += `</select></div>`;
    return html;
  }
  function renderField(field) {
    const inputGroupId = `input-group-${field.key}`;
    let html = `<div class="input-group" id="${inputGroupId}">`;
    html += `<label for="config-${field.key}">${field.label}</label>`;
    if (field.description) {
      html += `<small class="description">${field.description}</small>`;
    }
    switch (field.type) {
      case "text":
        html += renderTextField(field);
        break;
      case "checkbox":
        html += renderCheckboxField(field);
        break;
      case "select":
        html += renderSelectField(field);
        break;
    }
    html += `</div>`;
    return html;
  }
  function renderTextField(field) {
    const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : "";
    return `<input 
        type="text" 
        id="config-${field.key}" 
        value="${field.value || ""}" 
        ${placeholder}
    >`;
  }
  function renderCheckboxField(field) {
    let html = `<input 
        type="checkbox" 
        id="config-${field.key}" 
        ${field.value ? "checked" : ""}
    >`;
    if (field.conditionalField) {
      const conditionalId = `config-${field.key}-conditional`;
      const optionSelectId = `config-${field.key}-option`;
      const savedValue = field.conditionalField.savedValue || "";
      html += `
            <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                <label for="${optionSelectId}">${field.conditionalField.label}</label>
        `;
      if (field.conditionalField.description) {
        html += `<small class="description">${field.conditionalField.description}</small>`;
      }
      html += `
                <select id="${optionSelectId}" data-saved-value="${savedValue}">
                    <!-- Options populated dynamically by conditional logic -->
                </select>
            </div>
        `;
    }
    return html;
  }
  function renderSelectField(field) {
    let html = `<select id="config-${field.key}">`;
    if (field.options) {
      field.options.forEach((option) => {
        html += `<option value="${option}" ${field.value === option ? "selected" : ""}>${option}</option>`;
      });
    }
    html += `</select>`;
    return html;
  }

  // src/figma-api/plugin/views/scripts/configure.conditional.ts
  async function updateConditionalFields(changedFieldKey, currentSelection3) {
    if (!currentSelection3) return;
    const { componentName } = currentSelection3;
    const currentValues = collectCurrentValues();
    try {
      const response = await fetchConditionalRules(
        componentName,
        changedFieldKey,
        currentValues
      );
      response.affectedFields?.forEach((field) => {
        applyFieldState(field.key, field);
      });
    } catch (error) {
      console.error("Error updating conditional fields:", error);
    }
  }
  function applyFieldState(fieldKey, state) {
    const input = document.getElementById(`config-${fieldKey}`);
    const inputGroup = document.getElementById(`input-group-${fieldKey}`);
    if (!input || !inputGroup) return;
    if (state.disabled !== void 0) {
      input.disabled = state.disabled;
      inputGroup.style.opacity = state.disabled ? "0.5" : "1";
      inputGroup.style.pointerEvents = state.disabled ? "none" : "auto";
      if (state.disabled && input instanceof HTMLInputElement && input.type === "checkbox") {
        input.checked = false;
      }
    }
    if (state.hidden !== void 0) {
      inputGroup.style.display = state.hidden ? "none" : "block";
    }
    if (state.showConditionalField !== void 0) {
      const conditionalContainer = document.getElementById(`config-${fieldKey}-conditional`);
      if (conditionalContainer) {
        conditionalContainer.style.display = state.showConditionalField ? "block" : "none";
      }
    }
    if (state.conditionalOptions) {
      const optionSelect = document.getElementById(`config-${fieldKey}-option`);
      if (optionSelect) {
        const currentValue = optionSelect.value;
        const savedValue = optionSelect.getAttribute("data-saved-value") || "";
        optionSelect.innerHTML = "";
        state.conditionalOptions.forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          optionSelect.appendChild(optionElement);
        });
        if (state.savedConditionalValue) {
          optionSelect.value = state.savedConditionalValue;
        } else if (savedValue && state.conditionalOptions.includes(savedValue)) {
          optionSelect.value = savedValue;
        } else if (currentValue && state.conditionalOptions.includes(currentValue)) {
          optionSelect.value = currentValue;
        }
      }
    }
  }
  function collectCurrentValues() {
    const values = {};
    const allInputs = document.querySelectorAll('[id^="config-"]');
    allInputs.forEach((input) => {
      const fieldKey = input.id.replace("config-", "");
      if (input instanceof HTMLInputElement) {
        if (input.type === "checkbox") {
          values[fieldKey] = input.checked;
        } else {
          values[fieldKey] = input.value;
        }
      } else if (input instanceof HTMLSelectElement) {
        values[fieldKey] = input.value;
      }
    });
    return values;
  }

  // src/figma-api/plugin/views/scripts/configure.autosave.ts
  function autoSave(currentSelection3) {
    if (!currentSelection3) return;
    const updatedProperties = {};
    const allInputs = document.querySelectorAll('[id^="config-"]');
    allInputs.forEach((input) => {
      const fieldKey = input.id.replace("config-", "");
      if (fieldKey.endsWith("-conditional")) {
        return;
      }
      if (input instanceof HTMLInputElement) {
        if (input.type === "checkbox") {
          updatedProperties[fieldKey] = input.checked;
        } else {
          updatedProperties[fieldKey] = input.value;
        }
      } else if (input instanceof HTMLSelectElement) {
        if (fieldKey === "sectionHome-option") {
          updatedProperties["sectionHomeOption"] = input.value;
        } else {
          updatedProperties[fieldKey] = input.value;
        }
      }
    });
    console.log("\u{1F4BE} Saving properties:", updatedProperties);
    sendToPlugin({
      type: "update-properties",
      properties: updatedProperties
    });
    showSaveFeedback();
  }
  function handleConfigurationChange(currentSelection3, updateConfigFormCallback) {
    if (!currentSelection3) return;
    const configurationSelect = document.getElementById("config-journeyOption");
    if (!configurationSelect) return;
    const newConfiguration = configurationSelect.value;
    console.log("\u{1F504} Configuration changed to:", newConfiguration);
    const journeyOptionKey = Object.keys(currentSelection3.properties).find(
      (key) => key === "journeyOption" || key.startsWith("journeyOption#")
    );
    if (journeyOptionKey) {
      currentSelection3.properties[journeyOptionKey] = newConfiguration;
    }
    currentSelection3.properties.journeyOption = newConfiguration;
    autoSave(currentSelection3);
    updateConfigFormCallback();
  }
  function handleClearPluginData() {
    if (!confirm("This will clear all saved configuration data from the selected component(s). Continue?")) {
      return;
    }
    sendToPlugin({ type: "clear-plugin-data" });
  }

  // src/figma-api/plugin/views/scripts/configure.ts
  var currentSelection = null;
  async function initConfigureTab() {
    console.log("\u2705 Configure tab initialized");
    const clearButton = document.getElementById("clear-plugin-data");
    if (clearButton) {
      clearButton.onclick = handleClearPluginData2;
    }
  }
  function updateSelection(selection) {
    currentSelection = selection;
    updateConfigForm();
  }
  async function updateConfigForm() {
    const noSelection = document.getElementById("no-selection");
    let configForm = document.getElementById("config-form");
    if (!noSelection || !configForm) return;
    if (!currentSelection || !currentSelection.componentName) {
      noSelection.style.display = "block";
      configForm.style.display = "none";
      return;
    }
    noSelection.style.display = "none";
    configForm.style.display = "block";
    try {
      const formHTML = await buildFormForComponent(currentSelection);
      const newConfigForm = configForm.cloneNode(false);
      newConfigForm.innerHTML = formHTML;
      configForm.parentNode?.replaceChild(newConfigForm, configForm);
      configForm = newConfigForm;
      configForm.addEventListener("change", async (e) => {
        const target = e.target;
        if (target.id.startsWith("config-")) {
          const fieldKey = target.id.replace("config-", "");
          if (fieldKey === "journeyOption") {
            return;
          }
          const isConditionalDropdown = fieldKey.endsWith("-option");
          if (!isConditionalDropdown) {
            await updateConditionalFields(fieldKey, currentSelection);
          }
          autoSave2();
        }
      });
      await updateConditionalFields(null, currentSelection);
      console.log("\u2705 Form rendered successfully");
    } catch (error) {
      console.error("\u274C Error updating form:", error);
      if (configForm) {
        configForm.innerHTML = `
                <div class="section">
                    <h2>Error</h2>
                    <p class="error">Failed to load form configuration</p>
                </div>
            `;
      }
    }
  }
  function autoSave2() {
    autoSave(currentSelection);
  }
  function handleConfigurationChange2() {
    handleConfigurationChange(currentSelection, updateConfigForm);
  }
  function handleClearPluginData2() {
    handleClearPluginData();
  }
  window.autoSave = autoSave2;
  window.handleConfigurationChange = handleConfigurationChange2;
  window.handleClearPluginData = handleClearPluginData2;

  // src/figma-api/plugin/views/scripts/export.ts
  var currentExportSelection = { type: "none" };
  var currentSelection2 = null;
  var appFrameConfig = null;
  var pollingInterval = null;
  function initExportTab() {
    console.log("Export tab initialized");
    sendToPlugin({ type: "get-app-frame-config" });
  }
  function updateAppFrameConfig(config) {
    appFrameConfig = config;
    if (!pollingInterval) {
      updateExportForm();
    }
  }
  function updateExportSelection(selection) {
    currentSelection2 = selection;
    if (!selection || !selection.componentName || selection.componentName === "App_frame") {
      currentExportSelection = { type: "none" };
      console.log('\u{1F4ED} No selection or App_frame - setting type to "none"');
    } else {
      const isComponent = ["Journey", "ScreenBuilder_frame"].includes(selection.componentName);
      currentExportSelection = {
        type: isComponent ? "component" : "item",
        componentName: selection.componentName
      };
    }
    updateExportForm();
  }
  function updateExportForm() {
    const exportContainer = document.getElementById("export-form");
    if (!exportContainer) {
      console.log("\u26A0\uFE0F export-form container not found");
      return;
    }
    let html = "";
    if (currentExportSelection.type === "none") {
      html = buildFullAppExportForm();
    } else if (currentExportSelection.type === "component") {
      html = buildSingleComponentExportForm(currentExportSelection.componentName);
    } else if (currentExportSelection.type === "item") {
      html = buildItemWarning(currentExportSelection.componentName);
    }
    exportContainer.innerHTML = html;
  }
  function buildFullAppExportForm() {
    if (!appFrameConfig) {
      return `
            <div class="section">
                <h2>Export Options</h2>
                
                <div class="warning-box">
                    <strong>\u26A0\uFE0F App_frame Required</strong>
                    <p>Please create an App_frame component on your canvas before exporting.</p>
                    <p>The App_frame is required to configure your application settings.</p>
                </div>
            </div>
        `;
    }
    if (!appFrameConfig.appName || appFrameConfig.appName.trim() === "") {
      return `
            <div class="section">
                <h2>Export Options</h2>
                
                <div class="warning-box">
                    <strong>\u26A0\uFE0F App Name Required</strong>
                    <p>Please configure the App Name in your App_frame component first.</p>
                    <ol style="margin: 8px 0 0 20px; padding: 0;">
                        <li>Select the App_frame on your canvas</li>
                        <li>Go to the Configure tab</li>
                        <li>Enter an App Name</li>
                        <li>Return here to export</li>
                    </ol>
                </div>
            </div>
        `;
    }
    const hasExported = appFrameConfig.exportState?.hasExported || false;
    const exportedName = appFrameConfig.exportState?.exportedWithAppName;
    const nameChanged = hasExported && exportedName !== appFrameConfig.appName;
    const prototypeUrl = appFrameConfig.exportState?.prototypeUrl;
    return `
        <div class="section">
            <h2>Export Options</h2>
            <p class="description">Choose how to export your app configuration</p>
            
            <div class="component-info">
                <h3>Project Configuration</h3>
                <table class="info-table">
                    <tr>
                        <td><strong>App Name:</strong></td>
                        <td>${appFrameConfig.appName}</td>
                    </tr>
                    ${hasExported ? `
                    <tr>
                        <td><strong>Last Exported:</strong></td>
                        <td>${new Date(appFrameConfig.exportState.lastExportDate).toLocaleString()}</td>
                    </tr>
                    ` : ""}
                </table>
            </div>

            ${nameChanged ? `
            <div class="warning-box" style="margin-bottom: 16px;">
                <strong>\u26A0\uFE0F App Name Changed</strong>
                <p>App name was changed from "${exportedName}" to "${appFrameConfig.appName}".</p>
                <p>Re-exporting will create a new project folder.</p>
            </div>
            ` : ""}

            <!-- Option 1: Export Web -->
            <div class="export-option">
                <h3>\u{1F310} Web Prototype</h3>
                <p class="description">Generate a shareable web link with iPhone frame viewer</p>
                
                ${prototypeUrl ? `
                <div class="info-box" style="margin: 12px 0;">
                    <strong>Current Prototype:</strong>
                    <a href="${prototypeUrl}" target="_blank" style="display: block; margin-top: 4px; font-size: 11px; word-break: break-all;">${prototypeUrl}</a>
                </div>
                ` : ""}
                
                <div class="button-group">
                    <button class="primary" onclick="handleWebExport()">
                        ${prototypeUrl ? "\u{1F504} Update" : "\u{1F680} Generate"} Web Link
                    </button>
                </div>
                
                <!-- Polling status (hidden by default) -->
                <div id="web-export-status" style="display: none; margin-top: 12px;">
                    <div class="info-box">
                        <strong>Building prototype...</strong>
                        <div style="margin: 8px 0;">
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div id="web-progress-bar" style="background: #667eea; height: 100%; width: 0%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <p id="web-status-text" style="margin: 4px 0 0 0; font-size: 12px;">Starting build...</p>
                    </div>
                </div>
            </div>

            <!-- Option 2: Simulator Live -->
            <div class="export-option">
                <h3>\u{1F4F1} Simulator Live</h3>
                <p class="description">Create React Native project with full source code</p>
                
                <div class="input-group">
                    <label for="simulator-path">Export Path</label>
                    <input 
                        type="text" 
                        id="simulator-path" 
                        placeholder="/Users/username/projects"
                        value="${appFrameConfig.exportState?.exportPath || "/Users/dankupfer/Documents/dev/dn-server"}"
                    >
                    <small class="description">Project will be created at: {path}/${appFrameConfig.appName}/</small>
                </div>
                
                <div class="button-group">
                    <button class="primary" onclick="handleSimulatorExport()">
                        ${hasExported && !nameChanged ? "\u{1F504} Re-export" : "\u{1F4E6} Export"} Project
                    </button>
                </div>
            </div>

            <!-- Option 3: Download Zip (Coming Soon) -->
            <div class="export-option" style="opacity: 0.6;">
                <h3>\u{1F4E6} Download Zip</h3>
                <p class="description">Download complete project as zip file (Coming Soon)</p>
                
                <div class="button-group">
                    <button class="secondary" disabled>
                        \u{1F6A7} Coming Soon
                    </button>
                </div>
            </div>

            <div class="info-box" style="margin-top: 20px;">
                <strong>What gets exported:</strong>
                <ul>
                    <li>App configuration (from App_frame)</li>
                    <li>All Journey components with their properties</li>
                    <li>All ScreenBuilder frames with their properties</li>
                    <li>Complete routing and navigation setup</li>
                </ul>
            </div>
        </div>
    `;
  }
  function buildSingleComponentExportForm(componentName) {
    const componentId = currentSelection2?.properties?.id || currentSelection2?.properties?.prop0 || "unknown";
    const sectionHome = currentSelection2?.properties?.sectionHome || false;
    const sectionHomeOption = currentSelection2?.properties?.sectionHomeOption || "N/A";
    const sectionType = currentSelection2?.properties?.section_type || currentSelection2?.properties?.prop1 || "N/A";
    const hasExported = appFrameConfig?.exportState?.hasExported || false;
    const exportedName = appFrameConfig?.exportState?.exportedWithAppName;
    const currentName = appFrameConfig?.appName;
    const nameChanged = hasExported && exportedName !== currentName;
    const canExport = hasExported && !nameChanged && appFrameConfig;
    return `
        <div class="section">
            <h2>Export Single Component</h2>
            <p class="description">Export the selected ${componentName} to your React Native app.</p>
            
            <div class="component-info">
                <h3>Component Details</h3>
                <table class="info-table">
                    <tr>
                        <td><strong>Component:</strong></td>
                        <td>${componentName}</td>
                    </tr>
                    <tr>
                        <td><strong>ID:</strong></td>
                        <td>${componentId}</td>
                    </tr>
                    <tr>
                        <td><strong>Section Type:</strong></td>
                        <td>${sectionType}</td>
                    </tr>
                    <tr>
                        <td><strong>Is Home Tab:</strong></td>
                        <td>${sectionHome ? "Yes" : "No"}</td>
                    </tr>
                    ${sectionHome ? `
                    <tr>
                        <td><strong>Home Tab:</strong></td>
                        <td>${sectionHomeOption}</td>
                    </tr>
                    ` : ""}
                </table>
            </div>

            ${!canExport ? `
            <div class="warning-box">
                <strong>\u26A0\uFE0F ${!hasExported ? "Full App Export Required" : "App Name Changed"}</strong>
                <p>${!hasExported ? "Please export the full app configuration before exporting individual components." : `App name changed from "${exportedName}" to "${currentName}". Please re-export the full app first.`}</p>
            </div>
            ` : `
            <div class="info-box" style="margin-top: 16px;">
                <strong>Export Target:</strong>
                <p style="margin: 4px 0 0 0; font-size: 11px;">${appFrameConfig.exportState.exportPath}/${currentName}/fullAppConfig.json</p>
            </div>
            `}
            
            <div class="button-group">
                <button class="primary" onclick="handleSingleComponentExport()" ${!canExport ? "disabled" : ""}>
                    Export Component to App
                </button>
            </div>
            
            ${canExport ? `
            <div class="info-box">
                <strong>What happens:</strong>
                <ul>
                    <li>Component configuration will be sent to bridge server</li>
                    <li>Server will generate React Native files</li>
                    <li>Files will be added to your app project</li>
                    <li>Navigation will be automatically configured</li>
                </ul>
            </div>
            ` : ""}
        </div>
    `;
  }
  function buildItemWarning(componentName) {
    return `
        <div class="section">
            <h2>Export Not Available</h2>
            
            <div class="warning-box">
                <strong>\u26A0\uFE0F Cannot export individual items</strong>
                <p>You have selected a ${componentName} item component.</p>
                <p>To export:</p>
                <ul>
                    <li><strong>Deselect all</strong> to export the full app configuration</li>
                    <li><strong>Select a Journey or ScreenBuilder frame</strong> to export that component</li>
                </ul>
            </div>
        </div>
    `;
  }
  function handleWebExport() {
    console.log("\u{1F310} Starting web prototype export...");
    const statusDiv = document.getElementById("web-export-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
    }
    sendToPlugin({
      type: "export-full-app",
      exportType: "web",
      exportPath: ""
      // Not needed for web export
    });
  }
  function handleSimulatorExport() {
    const exportPath = document.getElementById("simulator-path")?.value;
    if (!exportPath || exportPath.trim() === "") {
      alert("Please enter an export path");
      return;
    }
    console.log("\u{1F4F1} Exporting to simulator:", exportPath);
    sendToPlugin({
      type: "export-full-app",
      exportType: "simulator",
      exportPath
    });
  }
  function handleSingleComponentExport() {
    if (!currentSelection2 || !currentSelection2.componentName) {
      alert("No component selected");
      return;
    }
    console.log("\u{1F680} Exporting single component:", currentSelection2);
    sendToPlugin({
      type: "export-single-component",
      componentData: {
        componentName: currentSelection2.componentName,
        properties: currentSelection2.properties
      }
    });
  }
  function handleFullAppExportComplete(data) {
    console.log("Export complete:", data);
    if (data.exportType === "web") {
      if (data.jobId) {
        console.log("\u{1F504} Starting polling for job:", data.jobId);
        const statusDiv = document.getElementById("web-export-status");
        const progressBar = document.getElementById("web-progress-bar");
        const statusText = document.getElementById("web-status-text");
        if (statusDiv) statusDiv.style.display = "block";
        if (progressBar) progressBar.style.width = "10%";
        if (statusText) statusText.textContent = "Build started...";
        startPolling(data.jobId);
      } else {
        alert("\u26A0\uFE0F No job ID returned from server");
      }
    } else if (data.exportType === "simulator") {
      alert(`\u2705 Simulator export complete!

Saved to: ${data.filePath}

Screens exported: ${data.screenCount}`);
    }
  }
  function startPolling(jobId) {
    pollStatus(jobId);
    pollingInterval = window.setInterval(() => {
      pollStatus(jobId);
    }, 5e3);
  }
  function pollStatus(jobId) {
    console.log("\u{1F4CA} Polling status for:", jobId);
    sendToPlugin({
      type: "poll-prototype-status",
      jobId
    });
  }
  function handlePrototypeStatusUpdate(data) {
    console.log("\u{1F4CA} Status update:", data);
    const progressBar = document.getElementById("web-progress-bar");
    const statusText = document.getElementById("web-status-text");
    if (progressBar) {
      progressBar.style.width = `${data.progress}%`;
    }
    if (statusText) {
      statusText.textContent = data.currentStep || "Processing...";
    }
    if (data.status === "complete") {
      console.log("\u2705 Build complete!");
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      if (statusText) {
        statusText.innerHTML = `<span style="color: #22c55e;">\u2705 Complete! Build time: ${data.result.buildTime}s</span>`;
      }
      setTimeout(() => {
        const statusDiv = document.getElementById("web-export-status");
        if (statusDiv) {
          statusDiv.style.display = "none";
        }
        if (appFrameConfig && appFrameConfig.exportState) {
          appFrameConfig.exportState.prototypeUrl = data.result.prototypeUrl;
        }
        updateExportForm();
        const message = `\u2705 Web prototype ready!

${data.result.prototypeUrl}

Click OK to open in browser.`;
        if (confirm(message)) {
          window.open(data.result.prototypeUrl, "_blank");
        }
      }, 2e3);
    } else if (data.status === "error") {
      console.error("\u274C Build failed:", data.error);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      if (statusText) {
        statusText.innerHTML = `<span style="color: #ef4444;">\u274C Error: ${data.error}</span>`;
      }
      alert(`Build failed: ${data.error}`);
    }
  }
  function handleSingleComponentExportComplete(data) {
    console.log(data);
    alert(`\u2705 Component exported!

Component: ${data.componentName}
Config updated successfully!`);
  }
  window.handleWebExport = handleWebExport;
  window.handleSimulatorExport = handleSimulatorExport;
  window.handleSingleComponentExport = handleSingleComponentExport;

  // src/figma-api/plugin/views/scripts/main.ts
  function init() {
    console.log("Figma Plugin UI initialised");
    initGenerateTab();
    initConfigureTab();
    initExportTab();
    setupTabButtons();
    const closeButton = document.getElementById("close");
    if (closeButton) {
      closeButton.onclick = () => {
        sendToPlugin({ type: "close" });
      };
    }
    setupMessageListener();
    sendToPlugin({ type: "get-selection" });
  }
  function setupTabButtons() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const tabName = event.target.getAttribute("data-tab");
        if (tabName) {
          switchTab(tabName, event.target);
        }
      });
    });
  }
  function switchTab(tabName, targetButton) {
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    const selectedTab = document.getElementById(tabName + "-tab");
    if (selectedTab) {
      selectedTab.classList.add("active");
    }
    targetButton.classList.add("active");
    if (tabName === "configure" || tabName === "export") {
      sendToPlugin({ type: "get-selection" });
    }
    if (tabName === "export") {
      sendToPlugin({ type: "get-app-frame-config" });
      const lastSelection = window.lastSelection || null;
      setTimeout(() => {
        updateExportSelection(lastSelection);
      }, 10);
    }
  }
  function setupMessageListener() {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      console.log("UI received message ::**::", msg);
      switch (msg.type) {
        case "components-created":
          handleComponentsCreated(msg.data);
          break;
        case "files-generated":
          handleFilesGenerated(msg.data);
          break;
        case "customer-generated":
          handleCustomerGenerated(msg.data);
          break;
        case "selection-changed":
          window.lastSelection = msg.data;
          updateSelection(msg.data);
          updateExportSelection(msg.data);
          break;
        case "app-frame-config":
          updateAppFrameConfig(msg.data);
          break;
        case "properties-updated":
          showFeedback("\u2705 Properties updated successfully!", "success");
          break;
        case "plugin-data-cleared":
          showFeedback(`\u2705 Cleared plugin data from ${msg.data.count} component(s)`, "success");
          break;
        case "export-success":
          handleFullAppExportComplete(msg.data);
          break;
        case "single-component-exported":
          handleSingleComponentExportComplete(msg.data);
          break;
        case "prototype-status-update":
          handlePrototypeStatusUpdate(msg.data);
          break;
        case "error":
          handleCustomerError();
          showFeedback(msg.data.message, "error");
          break;
      }
    };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
