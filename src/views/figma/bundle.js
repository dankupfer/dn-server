"use strict";
(() => {
  // src/views/figma/scripts/utils.ts
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

  // src/views/figma/scripts/generate.ts
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

  // src/views/figma/scripts/api.ts
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
  async function fetchFieldDefinitions() {
    const response = await fetch(`${API_BASE_URL}/field-definitions`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch field definitions");
    }
    return result.data;
  }

  // src/views/figma/scripts/configure.ts
  var currentSelection = null;
  var fieldDefinitions = null;
  async function initConfigureTab() {
    console.log("Configure tab initialized");
    try {
      fieldDefinitions = await fetchFieldDefinitions();
      console.log("\u2705 Field definitions loaded:", fieldDefinitions);
    } catch (error) {
      console.error("\u274C Error loading field definitions:", error);
    }
    const clearButton = document.getElementById("clear-plugin-data");
    if (clearButton) {
      clearButton.onclick = handleClearPluginData;
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
    const formHTML = await buildFormForComponent(currentSelection);
    configForm.innerHTML = formHTML;
    setupConditionalFieldListeners();
  }
  function shouldDisableField(fieldName, dependentFieldValue) {
    const fieldDef = fieldDefinitions?.[fieldName];
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
  function setupConditionalFieldListeners() {
    const componentName = currentSelection?.componentName;
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
        toggleSectionHomeOptions(conditionalContainerId, sectionHomeCheckboxId);
        autoSave();
      });
    }
    if (sectionTypeSelect) {
      sectionTypeSelect.addEventListener("change", () => {
        applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId);
        updateSectionHomeOptions(sectionTypeSelectId, conditionalContainerId, sectionHomeOptionSelectId);
        autoSave();
      });
    }
    applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId);
    toggleSectionHomeOptions(conditionalContainerId, sectionHomeCheckboxId);
  }
  function applyConditionalRules(sectionTypeSelectId, sectionHomeCheckboxId, sectionHomeInputGroupId) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId);
    const sectionHomeCheckbox = document.getElementById(sectionHomeCheckboxId);
    const sectionHomeInputGroup = document.getElementById(sectionHomeInputGroupId);
    if (!sectionTypeSelect || !sectionHomeCheckbox || !sectionHomeInputGroup) return;
    const sectionTypeValue = sectionTypeSelect.value;
    const shouldDisable = shouldDisableField("sectionHome", sectionTypeValue);
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
  function toggleSectionHomeOptions(conditionalContainerId, checkboxId) {
    const sectionHomeCheckbox = document.getElementById(checkboxId);
    const conditionalContainer = document.getElementById(conditionalContainerId);
    if (!conditionalContainer) return;
    if (sectionHomeCheckbox && sectionHomeCheckbox.checked && !sectionHomeCheckbox.disabled) {
      conditionalContainer.style.display = "block";
      const selectId = conditionalContainerId.replace("-conditional", "-option");
      const sectionTypeId = checkboxId.replace("sectionHome", "section_type").replace("prop2", "prop1");
      updateSectionHomeOptions(sectionTypeId, conditionalContainerId, selectId);
    } else {
      conditionalContainer.style.display = "none";
    }
  }
  function updateSectionHomeOptions(sectionTypeSelectId, conditionalContainerId, sectionHomeOptionSelectId) {
    const sectionTypeSelect = document.getElementById(sectionTypeSelectId);
    const sectionHomeOptionsSelect = document.getElementById(sectionHomeOptionSelectId);
    if (!sectionTypeSelect || !sectionHomeOptionsSelect) return;
    const sectionType = sectionTypeSelect.value;
    const fieldDef = fieldDefinitions?.sectionHome;
    if (!fieldDef || !fieldDef.conditionalOptions) return;
    const options = fieldDef.conditionalOptions[sectionType] || [];
    sectionHomeOptionsSelect.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      sectionHomeOptionsSelect.appendChild(optionElement);
    });
    if (currentSelection?.properties.sectionHomeOption) {
      sectionHomeOptionsSelect.value = currentSelection.properties.sectionHomeOption;
    }
  }
  function buildFieldFromDefinition(fieldName, fieldId, currentValue, overrides) {
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
  async function buildFormForComponent(selection) {
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
      html += buildScreenBuilderForm(properties);
    } else if (componentName === "Modal_frame") {
      html += buildModalForm(properties);
    } else {
      html += `<p>No configurable properties for this component.</p>`;
    }
    html += `</div>`;
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
  function buildAppFrameForm(properties) {
    let html = "";
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
  function buildScreenBuilderForm(properties) {
    let html = "";
    html += buildFieldFromDefinition("id", "config-id", properties.id, { label: "Screen ID" });
    html += buildFieldFromDefinition("section_type", "config-section_type", properties.section_type);
    html += buildFieldFromDefinition("sectionHome", "config-sectionHome", properties.sectionHome);
    return html;
  }
  function buildModalForm(properties) {
    let html = "";
    html += buildFieldFromDefinition("id", "config-id", properties.id, { label: "Modal ID" });
    html += buildFieldFromDefinition("section_type", "config-section_type", properties.section_type);
    html += buildFieldFromDefinition("sectionHome", "config-sectionHome", properties.sectionHome);
    return html;
  }
  function autoSave() {
    if (!currentSelection) return;
    const componentName = currentSelection.componentName;
    const updatedProperties = {};
    if (componentName === "App_frame") {
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
  function handleJourneyOptionChange() {
    if (!currentSelection) return;
    const newOption = document.getElementById("config-journeyOption")?.value;
    console.log("Journey option changed to:", newOption);
    currentSelection.properties.journeyOption = newOption;
    autoSave();
    console.log("Rebuilding form...");
    updateConfigForm();
  }
  function handleClearPluginData() {
    if (!confirm("This will clear all saved configuration data from the selected component(s). Continue?")) {
      return;
    }
    sendToPlugin({ type: "clear-plugin-data" });
  }
  window.autoSave = autoSave;
  window.handleJourneyOptionChange = handleJourneyOptionChange;
  window.handleClearPluginData = handleClearPluginData;

  // src/views/figma/scripts/main.ts
  function init() {
    console.log("Figma Plugin UI initialized");
    initGenerateTab();
    initConfigureTab();
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
    if (tabName === "configure") {
      sendToPlugin({ type: "get-selection" });
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
          updateSelection(msg.data);
          break;
        case "properties-updated":
          showFeedback("\u2705 Properties updated successfully!", "success");
          break;
        case "plugin-data-cleared":
          showFeedback(`\u2705 Cleared plugin data from ${msg.data.count} component(s)`, "success");
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
