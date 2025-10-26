"use strict";
(() => {
  // src/figma-api/views/scripts/utils.ts
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

  // src/figma-api/views/scripts/generate.ts
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

  // src/figma-api/views/scripts/api.ts
  var API_BASE_URL = "http://localhost:3001/api/figma";
  async function fetchJourneyOptions() {
    try {
      console.log("\u{1F4E1} Fetching journey options from:", `${API_BASE_URL}/journey-options`);
      const response = await fetch(`${API_BASE_URL}/journey-options`);
      const result = await response.json();
      console.log("\u{1F4E6} Server response:", result);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch journey options");
      }
      return result.data;
    } catch (error) {
      console.error("\u274C Error fetching journey options:", error);
      throw error;
    }
  }
  async function fetchFormConfig(journeyOption) {
    try {
      console.log("\u{1F517} Fetching form config for:", journeyOption);
      const response = await fetch(`${API_BASE_URL}/form-config/${journeyOption}`);
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch form config");
      }
      return result.data;
    } catch (error) {
      console.error("\u274C Error fetching form config:", error);
      throw error;
    }
  }
  async function fetchcommonDefinitions() {
    const response = await fetch(`${API_BASE_URL}/field-definitions`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch field definitions");
    }
    return result.data;
  }

  // src/figma-api/views/scripts/configure.conditional.ts
  function shouldDisableField(fieldName, dependentFieldValue, commonDefinitions2) {
    const fieldDef = commonDefinitions2?.[fieldName];
    if (!fieldDef || !fieldDef.conditionalRules) return false;
    const disableWhen = fieldDef.conditionalRules.disableWhen;
    if (!disableWhen) return false;
    for (const [dependentField, disableValues] of Object.entries(disableWhen)) {
      if (Array.isArray(disableValues) && disableValues.includes(dependentFieldValue)) {
        return true;
      }
    }
    return false;
  }
  function setupConditionalFieldListeners(currentSelection3, commonDefinitions2, autoSaveCallback) {
    const componentName = currentSelection3?.componentName;
    let sectionHomeCheckboxId;
    let sectionHomeInputGroupId;
    let sectionTypeSelectId;
    let conditionalContainerId;
    let sectionHomeOptionSelectId;
    if (componentName === "Journey") {
      sectionHomeCheckboxId = "config-prop2";
      sectionHomeInputGroupId = "input-group-prop2";
      sectionTypeSelectId = "config-prop1";
      conditionalContainerId = "config-prop2-conditional";
      sectionHomeOptionSelectId = "config-prop2-option";
    } else {
      sectionHomeCheckboxId = "config-sectionHome";
      sectionHomeInputGroupId = "input-group-sectionHome";
      sectionTypeSelectId = "config-section_type";
      conditionalContainerId = "config-sectionHome-conditional";
      sectionHomeOptionSelectId = "config-sectionHome-option";
    }
    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId);
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId);
    if (sectionHomeCheckbox) {
      sectionHomeCheckbox.addEventListener("change", () => {
        toggleSectionHomeOptions(
          conditionalContainerId,
          sectionHomeCheckboxId,
          commonDefinitions2,
          currentSelection3
        );
        autoSaveCallback();
      });
    }
    if (sectionTypeSelect) {
      sectionTypeSelect.addEventListener("change", () => {
        applyConditionalRules(
          sectionTypeSelectId,
          sectionHomeCheckboxId,
          sectionHomeInputGroupId,
          commonDefinitions2
        );
        updateSectionHomeOptions(
          sectionTypeSelectId,
          conditionalContainerId,
          sectionHomeOptionSelectId,
          commonDefinitions2,
          currentSelection3
        );
        autoSaveCallback();
      });
    }
    applyConditionalRules(
      sectionTypeSelectId,
      sectionHomeCheckboxId,
      sectionHomeInputGroupId,
      commonDefinitions2
    );
    toggleSectionHomeOptions(
      conditionalContainerId,
      sectionHomeCheckboxId,
      commonDefinitions2,
      currentSelection3
    );
  }
  function applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId, commonDefinitions2) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId);
    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId);
    const sectionHomeInputGroup = document.getElementById(sectionHomeInputGroupId);
    if (!sectionTypeSelect || !sectionHomeCheckbox || !sectionHomeInputGroup) return;
    const sectionTypeValue = sectionTypeSelect.value;
    const shouldDisable = shouldDisableField("sectionHome", sectionTypeValue, commonDefinitions2);
    if (shouldDisable) {
      sectionHomeCheckbox.disabled = true;
      sectionHomeCheckbox.checked = false;
      sectionHomeInputGroup.style.opacity = "0.5";
      sectionHomeInputGroup.style.pointerEvents = "none";
      const conditionalContainerId = sectionHomeCheckboxId.replace("config-", "config-") + "-conditional";
      const conditionalContainer = document.getElementById(conditionalContainerId);
      if (conditionalContainer) {
        conditionalContainer.style.display = "none";
      }
    } else {
      sectionHomeCheckbox.disabled = false;
      sectionHomeInputGroup.style.opacity = "1";
      sectionHomeInputGroup.style.pointerEvents = "auto";
    }
  }
  function toggleSectionHomeOptions(conditionalContainerId, checkboxId, commonDefinitions2, currentSelection3) {
    const sectionHomeCheckbox = document.getElementById(checkboxId);
    const conditionalContainer = document.getElementById(conditionalContainerId);
    if (!conditionalContainer) return;
    if (sectionHomeCheckbox && sectionHomeCheckbox.checked && !sectionHomeCheckbox.disabled) {
      conditionalContainer.style.display = "block";
      const selectId = conditionalContainerId.replace("-conditional", "-option");
      const sectionTypeId = checkboxId.replace("sectionHome", "section_type").replace("prop2", "prop1");
      updateSectionHomeOptions(
        sectionTypeId,
        conditionalContainerId,
        selectId,
        commonDefinitions2,
        currentSelection3
      );
    } else {
      conditionalContainer.style.display = "none";
    }
  }
  function updateSectionHomeOptions(sectionTypeSelectId, conditionalContainerId, selectId, commonDefinitions2, currentSelection3) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId);
    const optionSelect = document.getElementById(selectId);
    if (!sectionTypeSelect || !optionSelect) return;
    const sectionType = sectionTypeSelect.value;
    const fieldDef = commonDefinitions2?.sectionHome;
    if (!fieldDef || !fieldDef.conditionalOptions) return;
    const options = fieldDef.conditionalOptions[sectionType] || [];
    optionSelect.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      optionSelect.appendChild(optionElement);
    });
    if (currentSelection3?.properties.sectionHomeOption) {
      optionSelect.value = currentSelection3.properties.sectionHomeOption;
    }
  }

  // src/figma-api/views/scripts/configure.builders.ts
  async function buildFormForComponent(selection, fieldDefinitions) {
    const { componentName, properties } = selection;
    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;
    if (componentName === "Journey") {
      const journeyOption = properties.journeyOption || "CoreJourney";
      console.log("\u{1F3AF} Journey component detected");
      console.log("\u{1F3AF} journeyOption:", journeyOption);
      console.log("\u{1F3AF} properties:", properties);
      try {
        html += await buildJourneyOptionSelector(properties, journeyOption);
        console.log("\u{1F517} Fetching form config for:", journeyOption);
        const formConfig = await fetchFormConfig(journeyOption);
        console.log("\u2705 Form config received:", formConfig);
        html += buildDynamicFields(formConfig.fields, properties);
      } catch (error) {
        console.error("\u274C Error in Journey form building:", error);
        html += `<p class="error">Error loading form: ${error instanceof Error ? error.message : "Unknown error"}</p>`;
      }
    } else if (componentName === "App_frame") {
      html += buildAppFrameForm(properties);
    } else if (componentName === "ScreenBuilder_frame") {
      html += buildScreenBuilderForm(properties, fieldDefinitions);
    } else if (componentName === "Modal_frame") {
      html += buildModalForm(properties, fieldDefinitions);
    } else {
      html += `<p>No configurable properties for this component.</p>`;
    }
    html += `</div>`;
    return html;
  }
  function buildFieldFromDefinition(fieldName, fieldId, currentValue, fieldDefinitions, overrides) {
    const fieldDef = fieldDefinitions?.[fieldName] || {};
    const label = overrides?.label || fieldDef.label || fieldName;
    const description = overrides?.description || fieldDef.description || "";
    const defaultValue = overrides?.defaultValue || fieldDef.defaultValue || "";
    const value = currentValue !== void 0 ? currentValue : defaultValue;
    const inputGroupId = `input-group-${fieldName}`;
    let html = `<div class="input-group" id="${inputGroupId}">`;
    html += `<label for="${fieldId}">${label}</label>`;
    if (description) {
      html += `<small class="description">${description}</small>`;
    }
    const fieldType = fieldDef.type || "text";
    if (fieldType === "checkbox") {
      html += `<input type="checkbox" id="${fieldId}" ${value ? "checked" : ""} onchange="autoSave()">`;
      if (fieldName === "sectionHome") {
        const conditionalId = `${fieldId}-conditional`;
        const optionSelectId = `${fieldId}-option`;
        html += `
                <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                    <label for="${optionSelectId}">Home Tab</label>
                    <small class="description">Select which home tab to display</small>
                    <select id="${optionSelectId}" onchange="autoSave()">
                        <!-- Options populated dynamically -->
                    </select>
                </div>
            `;
      }
    } else if (fieldType === "select" && fieldDef.options) {
      html += `<select id="${fieldId}" onchange="autoSave()">`;
      fieldDef.options.forEach((option) => {
        html += `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`;
      });
      html += `</select>`;
    } else {
      html += `<input type="text" id="${fieldId}" value="${value}" onchange="autoSave()">`;
    }
    html += `</div>`;
    return html;
  }
  function buildDynamicFields(fields, properties) {
    let html = "";
    fields.forEach((field) => {
      const value = properties[field.genericKey] || field.defaultValue;
      const inputGroupId = `input-group-${field.genericKey}`;
      html += `<div class="input-group" id="${inputGroupId}">`;
      html += `<label for="config-${field.genericKey}">${field.label}</label>`;
      if (field.description) {
        html += `<small class="description">${field.description}</small>`;
      }
      if (field.type === "text") {
        html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
      } else if (field.type === "checkbox") {
        html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? "checked" : ""} onchange="autoSave()">`;
        if (field.name === "sectionHome") {
          const conditionalId = `config-${field.genericKey}-conditional`;
          const optionSelectId = `config-${field.genericKey}-option`;
          html += `
                    <div id="${conditionalId}" style="display: none; margin-top: 12px;">
                        <label for="${optionSelectId}">Home Tab</label>
                        <small class="description">Select which home tab to display</small>
                        <select id="${optionSelectId}" onchange="autoSave()">
                            <!-- Options populated dynamically -->
                        </select>
                    </div>
                `;
        }
      } else if (field.type === "select" && field.options) {
        html += `<select id="config-${field.genericKey}" onchange="autoSave()">`;
        field.options.forEach((option) => {
          html += `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`;
        });
        html += `</select>`;
      }
      html += `</div>`;
    });
    return html;
  }
  async function buildJourneyOptionSelector(properties, currentOption) {
    try {
      console.log("\u{1F50D} Building selector with currentOption:", currentOption);
      const journeyOptions = await fetchJourneyOptions();
      console.log("\u{1F4CB} Available journey options:", journeyOptions);
      console.log("\u{1F4CB} Number of options:", journeyOptions.length);
      let html = `
            <div class="input-group">
                <label for="config-journeyOption">Journey Option</label>
                <small class="description">Select the type of journey to configure</small>
                <select id="config-journeyOption" onchange="handleJourneyOptionChange()">
        `;
      journeyOptions.forEach((option) => {
        console.log("  - Adding option:", option.journeyOption, "Label:", option.label);
        html += `<option value="${option.journeyOption}" ${currentOption === option.journeyOption ? "selected" : ""}>
                ${option.label}
            </option>`;
      });
      html += `</select></div>`;
      return html;
    } catch (error) {
      console.error("\u274C Error building journey option selector:", error);
      return '<p class="error">Error loading journey options</p>';
    }
  }
  function buildAppFrameForm(properties) {
    let html = "";
    html += `
        <div class="input-group">
            <label for="config-appName">App Name</label>
            <small class="description">Name of your application (used for project folder and package.json)</small>
            <input type="text" id="config-appName" value="${properties.appName || ""}" onchange="autoSave()" placeholder="myApp">
        </div>
    `;
    html += `
        <div class="input-group">
            <label for="config-brand">Brand</label>
            <small class="description">Brand theme to use (BrandA, BrandB)</small>
            <select id="config-brand" onchange="autoSave()">
                <option value="BrandA" ${properties.brand === "BrandA" ? "selected" : ""}>Brand A</option>
                <option value="BrandB" ${properties.brand === "BrandB" ? "selected" : ""}>Brand B</option>
            </select>
        </div>
    `;
    html += `
        <div class="input-group">
            <label for="config-mode">Theme Mode</label>
            <small class="description">Light or dark theme mode</small>
            <select id="config-mode" onchange="autoSave()">
                <option value="light" ${properties.mode === "light" ? "selected" : ""}>Light</option>
                <option value="dark" ${properties.mode === "dark" ? "selected" : ""}>Dark</option>
            </select>
        </div>
    `;
    html += `
        <div class="input-group">
            <label for="config-apiBase">API Base URL</label>
            <small class="description">Base URL for API endpoints</small>
            <input type="text" id="config-apiBase" value="${properties.apiBase || "http://localhost:3001"}" onchange="autoSave()">
        </div>
    `;
    return html;
  }
  function buildScreenBuilderForm(properties, fieldDefinitions) {
    let html = "";
    html += buildFieldFromDefinition("id", "config-id", properties.id, fieldDefinitions, { label: "Screen ID" });
    html += buildFieldFromDefinition("section_type", "config-section_type", properties.section_type, fieldDefinitions);
    html += buildFieldFromDefinition("sectionHome", "config-sectionHome", properties.sectionHome, fieldDefinitions);
    return html;
  }
  function buildModalForm(properties, fieldDefinitions) {
    let html = "";
    html += buildFieldFromDefinition("id", "config-id", properties.id, fieldDefinitions, { label: "Modal ID" });
    html += buildFieldFromDefinition("section_type", "config-section_type", properties.section_type, fieldDefinitions);
    html += buildFieldFromDefinition("sectionHome", "config-sectionHome", properties.sectionHome, fieldDefinitions);
    return html;
  }

  // src/figma-api/views/scripts/configure.autosave.ts
  function autoSave(currentSelection3) {
    if (!currentSelection3) return;
    const componentName = currentSelection3.componentName;
    const updatedProperties = {};
    if (componentName === "App_frame") {
      updatedProperties.appName = document.getElementById("config-appName")?.value;
      updatedProperties.brand = document.getElementById("config-brand")?.value;
      updatedProperties.mode = document.getElementById("config-mode")?.value;
      updatedProperties.apiBase = document.getElementById("config-apiBase")?.value;
    } else if (componentName === "Journey") {
      updatedProperties.journeyOption = document.getElementById("config-journeyOption")?.value;
      for (let i = 0; i < 10; i++) {
        const propKey = `prop${i}`;
        const element = document.getElementById(`config-${propKey}`);
        if (element) {
          if (element instanceof HTMLInputElement) {
            if (element.type === "checkbox") {
              updatedProperties[propKey] = element.checked;
            } else {
              updatedProperties[propKey] = element.value;
            }
          } else if (element instanceof HTMLSelectElement) {
            updatedProperties[propKey] = element.value;
          }
        }
      }
      const sectionHomeCheckbox = document.getElementById("config-prop2");
      if (sectionHomeCheckbox?.checked && !sectionHomeCheckbox.disabled) {
        const sectionHomeOptionSelect = document.getElementById("config-prop2-option");
        if (sectionHomeOptionSelect) {
          updatedProperties.sectionHomeOption = sectionHomeOptionSelect.value;
        }
      }
    } else if (componentName === "ScreenBuilder_frame" || componentName === "Modal_frame") {
      updatedProperties.id = document.getElementById("config-id")?.value;
      updatedProperties.section_type = document.getElementById("config-section_type")?.value;
      updatedProperties.sectionHome = document.getElementById("config-sectionHome")?.checked;
      const sectionHomeCheckbox = document.getElementById("config-sectionHome");
      if (sectionHomeCheckbox?.checked && !sectionHomeCheckbox.disabled) {
        const sectionHomeOptionSelect = document.getElementById("config-sectionHome-option");
        if (sectionHomeOptionSelect) {
          updatedProperties.sectionHomeOption = sectionHomeOptionSelect.value;
        }
      }
    }
    console.log("\u{1F4BE} Saving properties:", updatedProperties);
    sendToPlugin({
      type: "update-properties",
      properties: updatedProperties
    });
    showSaveFeedback();
  }
  function handleJourneyOptionChange(currentSelection3, updateConfigFormCallback) {
    if (!currentSelection3) return;
    const newOption = document.getElementById("config-journeyOption")?.value;
    console.log("Journey option changed to:", newOption);
    currentSelection3.properties.journeyOption = newOption;
    autoSave(currentSelection3);
    console.log("Rebuilding form...");
    updateConfigFormCallback();
  }
  function handleClearPluginData() {
    if (!confirm("This will clear all saved configuration data from the selected component(s). Continue?")) {
      return;
    }
    sendToPlugin({ type: "clear-plugin-data" });
  }

  // src/figma-api/views/scripts/configure.ts
  var currentSelection = null;
  var commonDefinitions = null;
  async function initConfigureTab() {
    console.log("Configure tab initialized");
    try {
      commonDefinitions = await fetchcommonDefinitions();
      console.log("\u2705 Field definitions loaded:", commonDefinitions);
    } catch (error) {
      console.error("\u274C Error loading field definitions:", error);
    }
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
    const configForm = document.getElementById("config-form");
    if (!noSelection || !configForm) return;
    if (!currentSelection || !currentSelection.componentName) {
      noSelection.style.display = "block";
      configForm.style.display = "none";
      return;
    }
    noSelection.style.display = "none";
    configForm.style.display = "block";
    const formHTML = await buildFormForComponent(currentSelection, commonDefinitions);
    configForm.innerHTML = formHTML;
    setupConditionalFieldListeners(currentSelection, commonDefinitions, autoSave2);
  }
  function autoSave2() {
    autoSave(currentSelection);
  }
  function handleJourneyOptionChange2() {
    handleJourneyOptionChange(currentSelection, updateConfigForm);
  }
  function handleClearPluginData2() {
    handleClearPluginData();
  }
  window.autoSave = autoSave2;
  window.handleJourneyOptionChange = handleJourneyOptionChange2;
  window.handleClearPluginData = handleClearPluginData2;

  // src/figma-api/views/scripts/export.ts
  var currentExportSelection = { type: "none" };
  var currentSelection2 = null;
  var appFrameConfig = null;
  function initExportTab() {
    console.log("Export tab initialized");
    sendToPlugin({ type: "get-app-frame-config" });
  }
  function updateAppFrameConfig(config) {
    console.log("\u{1F3AF} App_frame config updated:", config);
    appFrameConfig = config;
    updateExportForm();
  }
  function updateExportSelection(selection) {
    console.log("\u{1F504} updateExportSelection called with:", selection);
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
      console.log("\u{1F4E6} Selection type:", currentExportSelection.type, "Component:", selection.componentName);
    }
    updateExportForm();
  }
  function updateExportForm() {
    console.log("\u{1F3A8} updateExportForm called, selection type:", currentExportSelection.type);
    const exportContainer = document.getElementById("export-form");
    if (!exportContainer) {
      console.log("\u26A0\uFE0F export-form container not found");
      return;
    }
    console.log("\u2705 export-form container found, building form...");
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
                <h2>Export Full App</h2>
                
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
                <h2>Export Full App</h2>
                
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
    return `
        <div class="section">
            <h2>Export Full App</h2>
            <p class="description">Export complete app configuration from all Journey and ScreenBuilder frames on the canvas.</p>
            
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
                    <tr>
                        <td><strong>Export Path:</strong></td>
                        <td style="font-size: 11px;">${appFrameConfig.exportState.exportPath}</td>
                    </tr>
                    ` : ""}
                </table>
            </div>

            ${nameChanged ? `
            <div class="warning-box" style="margin-bottom: 16px;">
                <strong>\u26A0\uFE0F App Name Changed</strong>
                <p>App name was changed from "${exportedName}" to "${appFrameConfig.appName}".</p>
                <p>Re-exporting will create a new project folder. Component exports are disabled until full export completes.</p>
            </div>
            ` : ""}
            
            <div class="input-group">
                <label for="export-path">Export Path</label>
                <small class="description">Directory where project folder will be created</small>
                <input 
                    type="text" 
                    id="export-path" 
                    placeholder="/Users/username/projects"
                    value="${appFrameConfig.exportState?.exportPath || ""}"
                >
                <small class="description">Project will be created at: {path}/${appFrameConfig.appName}/</small>
            </div>
            
            <div class="button-group">
                <button class="primary" onclick="handleFullAppExport()">
                    ${hasExported && !nameChanged ? "Re-export" : "Export"} Full App Config
                </button>
            </div>
            
            <div class="info-box">
                <strong>What gets exported:</strong>
                <ul>
                    <li>App configuration (from App_frame)</li>
                    <li>All Journey components with their properties</li>
                    <li>All ScreenBuilder frames with their properties</li>
                    <li>Creates project structure: ${appFrameConfig.appName}/fullAppConfig.json</li>
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
  function handleFullAppExport() {
    const exportPath = document.getElementById("export-path")?.value;
    if (!exportPath || exportPath.trim() === "") {
      alert("Please enter an export path");
      return;
    }
    console.log("\u{1F680} Exporting full app to:", exportPath);
    sendToPlugin({
      type: "export-full-app",
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
    alert(`\u2705 Full app config exported!

Saved to: ${data.filePath}

Screens exported: ${data.screenCount}`);
  }
  function handleSingleComponentExportComplete(data) {
    alert(`\u2705 Component exported!

Module: ${data.moduleName}
Files: ${data.files?.length || 0}`);
  }
  window.handleFullAppExport = handleFullAppExport;
  window.handleSingleComponentExport = handleSingleComponentExport;

  // src/figma-api/views/scripts/main.ts
  function init() {
    console.log("Figma Plugin UI initialized");
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
          console.log("\u{1F514} selection-changed received:", msg.data);
          console.log("   componentName:", msg.data?.componentName);
          console.log("   properties:", msg.data?.properties);
          window.lastSelection = msg.data;
          updateSelection(msg.data);
          updateExportSelection(msg.data);
          break;
        case "app-frame-config":
          console.log("\u{1F3AF} app-frame-config received:", msg.data);
          updateAppFrameConfig(msg.data);
          break;
        case "properties-updated":
          showFeedback("\u2705 Properties updated successfully!", "success");
          break;
        case "plugin-data-cleared":
          showFeedback(`\u2705 Cleared plugin data from ${msg.data.count} component(s)`, "success");
          break;
        case "full-app-exported":
          handleFullAppExportComplete(msg.data);
          break;
        case "single-component-exported":
          handleSingleComponentExportComplete(msg.data);
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
