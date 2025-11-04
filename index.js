// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "st-extension-example-master";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
  // UI Settings
  translate: false,
  allowMultiple: true,
  reroll: false,
  
  // Expression Configuration
  classifier: "none",
  fallback: "neutral",
  
  // File Paths
  basePath: "UserExpressions",  // Relative to SillyTavern/public/
  useRepository: false,
  repositoryUrl: "https://raw.githubusercontent.com/yourusername/expressions/main/",
  
  // Expression Definitions
  expressions: {
    neutral: { count: 1, enabled: true },
    happy: { count: 1, enabled: true },
    angry: { count: 1, enabled: true },
    sad: { count: 1, enabled: true },
    surprised: { count: 1, enabled: true },
    // Add more expressions as needed
  },
  
  // Runtime State
  current: { label: "", url: "" },
  lastUsed: {},
  images: {},  // Cache of loaded images
};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  } else {
    for (const k of Object.keys(defaultSettings)) {
      if (typeof extension_settings[extensionName][k] === "undefined") {
        extension_settings[extensionName][k] = defaultSettings[k];
      }
    }
  }

  // Updating settings in the UI
  $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
  $("#userexp_translate").prop("checked", extension_settings[extensionName].translate);
  $("#userexp_multi").prop("checked", extension_settings[extensionName].allowMultiple);
  $("#userexp_reroll").prop("checked", extension_settings[extensionName].reroll);
  $("#userexp_classifier").val(extension_settings[extensionName].classifier);
  $("#userexp_sprite_override").val(extension_settings[extensionName].spriteOverride || "");
  renderImagesList();
  updateFallbackOptions();
  ensureFloatingContainer();
}

// This function is called when the extension settings are changed in the UI
function onExampleInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].example_setting = value;
  saveSettingsDebounced();
}

// This function is called when the button is clicked
function onButtonClick() {
  // You can do whatever you want here
  // Let's make a popup appear with the checked setting
  toastr.info(
    `The checkbox is ${extension_settings[extensionName].example_setting ? "checked" : "not checked"}`,
    "A popup appeared because you clicked the button!"
  );
}

function setSetting(path, value) {
  extension_settings[extensionName][path] = value;
  saveSettingsDebounced();
}

function renderImagesList() {
  const root = $("#userexp_images_list");
  root.empty();
  const images = extension_settings[extensionName].images || {};
  const labels = Object.keys(images).sort();
  for (const label of labels) {
    const arr = Array.isArray(images[label]) ? images[label] : [];
    for (let i = 0; i < arr.length; i++) {
      const url = arr[i];
      const id = `${label}::${i}`;
      const li = $(`<li data-id="${id}" style="display:flex;align-items:center;gap:8px;margin:4px 0;"></li>`);
      li.append($(`<img src="${url}" alt="${label}" style="height:32px;width:32px;object-fit:cover;border-radius:4px;"/>`));
      li.append($(`<span style="flex:1;">${label}</span>`));
      const btn = $(`<button class="menu_button" type="button">x</button>`);
      btn.on("click", () => {
        const list = extension_settings[extensionName].images[label] || [];
        list.splice(i, 1);
        extension_settings[extensionName].images[label] = list;
        saveSettingsDebounced();
        renderImagesList();
        updateFallbackOptions();
      });
      li.append(btn);
      root.append(li);
    }
  }
}

function updateFallbackOptions() {
  const images = extension_settings[extensionName].images || {};
  const labels = Object.keys(images).filter(k => (images[k] || []).length > 0).sort();
  const sel = $("#userexp_fallback");
  sel.empty();
  sel.append(`<option value="">[ No fallback ]</option>`);
  for (const l of labels) sel.append(`<option value="${l}">${l}</option>`);
  const cur = extension_settings[extensionName].fallback || "";
  if (cur && labels.includes(cur)) sel.val(cur); else sel.val("");
}

function ensureFloatingContainer() {
  if ($("#userexp_floating").length) return;
  const wrap = $(`<div id="userexp_floating"><img id="userexp_floating_img" src="" alt=""/></div>`);
  $("body").append(wrap);
}

function updatePreview(url, label) {
  const img = $("#userexp_preview");
  const labelEl = $("#userexp_preview_label");
  const sourceEl = $("#userexp_preview_source");
  
  if (url) {
    img.attr("src", url).css("display", "block");
    labelEl.text(label || "Unknown");
    
    // Show the source of the image (local or remote)
    const st = extension_settings[extensionName];
    if (st.useRepository && st.repositoryUrl) {
      sourceEl.text("Remote: " + st.repositoryUrl);
    } else {
      sourceEl.text("Local: " + st.basePath);
    }
  } else {
    img.attr("src", "").css("display", "none");
    labelEl.text("-");
    sourceEl.text("-");
  }
}

function updateFloating(url) {
  if (!$("#userexp_floating").length) return;
  $("#userexp_floating_img").attr("src", url || "");
}

async function getImagePath(expression, index = 0) {
  const st = extension_settings[extensionName];
  if (st.useRepository && st.repositoryUrl) {
    // Remote repository path
    return `${st.repositoryUrl}${expression}_${index}.png`;
  } else {
    // Local path relative to SillyTavern/public/
    return `./${st.basePath}/${expression}_${index}.png`;
  }
}

async function pickSprite(label) {
  const st = extension_settings[extensionName];
  
  // If label doesn't exist or is disabled, use fallback
  if (!st.expressions[label]?.enabled) {
    if (st.fallback && st.fallback !== label) {
      return pickSprite(st.fallback);
    }
    return { label: "", url: "" };
  }

  const expression = st.expressions[label];
  const count = expression.count || 1;
  
  // Pick a random index if multiple allowed
  let index = 0;
  if (st.allowMultiple && count > 1) {
    index = Math.floor(Math.random() * count);
    if (st.reroll && count > 1) {
      const last = st.lastUsed[label];
      if (typeof last === "number" && last === index) {
        index = (index + 1) % count;
      }
    }
  }
  
  st.lastUsed[label] = index;
  
  // Get the URL for the selected image
  const url = await getImagePath(label, index);
  
  // Preload the image
  await new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // Continue even if image fails to load
    img.src = url;
  });
  
  return { label, url };
}

function classifyText(text) {
  if (!text) return "";
  const t = String(text).toLowerCase();
  if (/\b(happy|joy|glad|yay|love|good)\b/.test(t)) return "joy";
  if (/\b(angry|mad|annoyed|furious|rage)\b/.test(t)) return "anger";
  if (/\b(sad|unhappy|depressed|cry|tears)\b/.test(t)) return "sad";
  if (/\b(fear|scared|afraid|nervous|anxious)\b/.test(t)) return "fear";
  if (/\b(surprised|wow|shocked|unexpected)\b/.test(t)) return "surprise";
  if (/\b(disgust|gross|eww)\b/.test(t)) return "disgust";
  if (/\b(laugh|lol|lmao|haha)\b/.test(t)) return "joy";
  return "neutral";
}

async function handleUserMessageEvent(data) {
  try {
    let text = data?.mes || data?.text || data?.message?.mes || data?.message?.text;
    if (!text) {
      const ctx = getContext();
      const msgs = ctx?.chat?.messages || ctx?.chat?.chat || [];
      const last = Array.isArray(msgs) ? msgs[msgs.length - 1] : undefined;
      text = last?.mes || last?.text;
    }
    
    // Classify the text to get the expression label
    const label = classifyText(text);
    
    // Get the appropriate sprite for this expression
    const choice = await pickSprite(label);
    
    // Update the UI
    extension_settings[extensionName].current = choice;
    saveSettingsDebounced();
    updatePreview(choice.url, choice.label);
    updateFloating(choice.url);
  } catch (e) {
    console.error("Error in handleUserMessageEvent:", e);
  }
}

// This function is called when the extension is loaded
// Initialize the settings UI
function initializeSettingsUI() {
  const st = extension_settings[extensionName];
  
  // Set initial values
  $("#userexp_use_repository").prop("checked", st.useRepository);
  $("#userexp_repository_url").val(st.repositoryUrl);
  $("#userexp_local_path").val(st.basePath);
  
  // Toggle between local and remote repository
  function updateRepositoryUI() {
    const useRepo = $("#userexp_use_repository").is(":checked");
    $("#userexp_repository_url").prop("disabled", !useRepo);
    $("#userexp_local_path").prop("disabled", useRepo);
  }
  
  // Set up event listeners
  $("#userexp_use_repository").on("change", function() {
    st.useRepository = $(this).is(":checked");
    saveSettingsDebounced();
    updateRepositoryUI();
    // Update preview to show new source
    if (st.current) {
      updatePreview(st.current.url, st.current.label);
    }
  });
  
  $("#userexp_repository_url").on("change", function() {
    let url = $(this).val().trim();
    // Ensure URL ends with a slash
    if (url && !url.endsWith('/')) {
      url += '/';
      $(this).val(url);
    }
    st.repositoryUrl = url;
    saveSettingsDebounced();
  });
  
  $("#userexp_local_path").on("change", function() {
    let path = $(this).val().trim();
    // Remove leading/trailing slashes
    path = path.replace(/^\/+|\/+$/g, '');
    st.basePath = path;
    saveSettingsDebounced();
  });
  
  // Initialize UI state
  updateRepositoryUI();
}

jQuery(async () => {
  // Load the settings HTML
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("#extensions_settings").append(settingsHtml);

  // Initialize the UI
  initializeSettingsUI();
  
  // These are examples of listening for events
  $("#my_button").on("click", onButtonClick);
  $("#example_setting").on("input", onExampleInput);
  $("#userexp_translate").on("input", (e) => setSetting("translate", Boolean($(e.target).prop("checked"))));
  $("#userexp_multi").on("input", (e) => setSetting("allowMultiple", Boolean($(e.target).prop("checked"))));
  $("#userexp_reroll").on("input", (e) => setSetting("reroll", Boolean($(e.target).prop("checked"))));
  $("#userexp_classifier").on("change", (e) => setSetting("classifier", String($(e.target).val())));
  $("#userexp_fallback").on("change", (e) => setSetting("fallback", String($(e.target).val())));
  $("#userexp_submit_override").on("click", () => setSetting("spriteOverride", String($("#userexp_sprite_override").val() || "")));
  $("#userexp_add_image").on("click", () => {
    const label = String($("#userexp_new_label").val() || "").trim();
    const url = String($("#userexp_new_url").val() || "").trim();
    if (!label || !url) return;
    const images = extension_settings[extensionName].images || {};
    images[label] = images[label] || [];
    images[label].push(url);
    extension_settings[extensionName].images = images;
    saveSettingsDebounced();
    $("#userexp_new_label").val("");
    $("#userexp_new_url").val("");
    renderImagesList();
    updateFallbackOptions();
  });

  // Load settings when starting things up (if you have any)
  loadSettings();
  try {
    const { eventSource, event_types } = getContext();
    eventSource.on(event_types.MESSAGE_SENT, handleUserMessageEvent);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, handleUserMessageEvent);
  } catch (e) {}
});
