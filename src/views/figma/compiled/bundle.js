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
  async function fetchComponentTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/component-types`);
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch component types");
      }
      return result.data;
    } catch (error) {
      console.error("Error fetching component types:", error);
      throw error;
    }
  }
  async function fetchFormConfig(componentType) {
    try {
      const response = await fetch(`${API_BASE_URL}/form-config/${componentType}`);
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch form config");
      }
      return result.data;
    } catch (error) {
      console.error("Error fetching form config:", error);
      throw error;
    }
  }

  // src/views/figma/scripts/configure.ts
  var currentSelection = null;
  function initConfigureTab() {
    console.log("Configure tab initialized");
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
  }
  async function buildFormForComponent(selection) {
    const { componentName, properties } = selection;
    let html = `<div class="section">`;
    html += `<h2>${componentName}</h2>`;
    if (componentName === "Journey") {
      const journeyType = properties.Type || "AccountCard";
      try {
        const formConfig = await fetchFormConfig(journeyType);
        html += await buildJourneyTypeSelector(properties);
        html += buildDynamicFields(formConfig.fields, properties);
      } catch (error) {
        console.error("Error fetching form config:", error);
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
  async function buildJourneyTypeSelector(properties) {
    try {
      const componentTypes = await fetchComponentTypes();
      const currentType = properties.Type || "AccountCard";
      let html = `
            <div class="input-group">
                <label for="config-Type">Component Type</label>
                <small class="description">Select the type of component to configure</small>
                <select id="config-Type" onchange="handleTypeChange()">
        `;
      componentTypes.forEach((type) => {
        html += `<option value="${type.componentType}" ${currentType === type.componentType ? "selected" : ""}>
                ${type.label} (${type.fieldCount} properties)
            </option>`;
      });
      html += `
                </select>
            </div>
        `;
      return html;
    } catch (error) {
      console.error("Error building type selector:", error);
      return '<p class="error">Error loading component types</p>';
    }
  }
  function buildDynamicFields(fields, properties) {
    let html = "";
    fields.forEach((field) => {
      const value = properties[field.genericKey] || field.defaultValue;
      html += `<div class="input-group">`;
      html += `<label for="config-${field.genericKey}">${field.label}</label>`;
      if (field.type === "text") {
        html += `<input type="text" id="config-${field.genericKey}" value="${value}" onchange="autoSave()">`;
      } else if (field.type === "checkbox") {
        html += `<input type="checkbox" id="config-${field.genericKey}" ${value ? "checked" : ""} onchange="autoSave()">`;
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
    return `
        <div class="input-group">
            <label for="config-brand">Brand</label>
            <small class="description">Brand theme to use (BrandA, BrandB)</small>
            <select id="config-brand" onchange="autoSave()">
                <option value="BrandA" ${properties.brand === "BrandA" ? "selected" : ""}>Brand A</option>
                <option value="BrandB" ${properties.brand === "BrandB" ? "selected" : ""}>Brand B</option>
            </select>
        </div>
        <div class="input-group">
            <label for="config-mode">Theme Mode</label>
            <small class="description">Light or dark theme mode</small>
            <select id="config-mode" onchange="autoSave()">
                <option value="light" ${properties.mode === "light" ? "selected" : ""}>Light</option>
                <option value="dark" ${properties.mode === "dark" ? "selected" : ""}>Dark</option>
            </select>
        </div>
        <div class="input-group">
            <label for="config-apiBase">API Base URL</label>
            <small class="description">Base URL for API endpoints</small>
            <input type="text" id="config-apiBase" value="${properties.apiBase || "http://localhost:3001"}" onchange="autoSave()">
        </div>
    `;
  }
  function buildScreenBuilderForm(properties) {
    return `
        <div class="input-group">
            <label for="config-id">Screen ID</label>
            <small class="description">Unique identifier for this screen</small>
            <input type="text" id="config-id" value="${properties.id || "screen-1"}" onchange="autoSave()">
        </div>
        <div class="input-group">
            <label for="config-section_type">Section Type</label>
            <small class="description">Where this screen appears: top, bottom, or modal</small>
            <select id="config-section_type" onchange="autoSave()">
                <option value="top" ${properties.section_type === "top" ? "selected" : ""}>Top</option>
                <option value="bottom" ${properties.section_type === "bottom" ? "selected" : ""}>Bottom</option>
                <option value="modal" ${properties.section_type === "modal" ? "selected" : ""}>Modal</option>
            </select>
        </div>
    `;
  }
  function buildModalForm(properties) {
    return `
        <div class="input-group">
            <label for="config-id">Modal ID</label>
            <small class="description">Unique identifier for this modal</small>
            <input type="text" id="config-id" value="${properties.id || "modal-1"}" onchange="autoSave()">
        </div>
        <div class="input-group">
            <label for="config-section_type">Section Type</label>
            <small class="description">Where this modal appears: top, bottom, or modal</small>
            <select id="config-section_type" onchange="autoSave()">
                <option value="top" ${properties.section_type === "top" ? "selected" : ""}>Top</option>
                <option value="bottom" ${properties.section_type === "bottom" ? "selected" : ""}>Bottom</option>
                <option value="modal" ${properties.section_type === "modal" ? "selected" : ""}>Modal</option>
            </select>
        </div>
    `;
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
      updatedProperties.Type = document.getElementById("config-Type")?.value;
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
    } else if (componentName === "ScreenBuilder_frame" || componentName === "Modal_frame") {
      updatedProperties.id = document.getElementById("config-id")?.value;
      updatedProperties.section_type = document.getElementById("config-section_type")?.value;
    }
    sendToPlugin({
      type: "update-properties",
      properties: updatedProperties
    });
    showSaveFeedback();
  }
  function handleTypeChange() {
    if (!currentSelection) return;
    const newType = document.getElementById("config-Type")?.value;
    console.log("Type changed to:", newType);
    currentSelection.properties.Type = newType;
    autoSave();
    console.log("Rebuilding form...");
    updateConfigForm();
  }
  window.autoSave = autoSave;
  window.handleTypeChange = handleTypeChange;

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
      console.log("UI received message:", msg);
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
          updateSelection(msg.data);
          break;
        case "properties-updated":
          showFeedback("\u2705 Properties updated successfully!", "success");
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
