// content.js
const defaultSettings = {
  enabled: true,
  fontFamily: 'Arial',
  fontSize: '16px',
  textColor: '#ffffff',
  textShadow: 'none',
  backgroundOpacity: '0.7'
};

function ensureCaptionStyleElement() {
  let style = document.getElementById('cc-customizer-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'cc-customizer-style';
    document.head.appendChild(style);
  }
  return style;
}

function getCssFontFamily(value) {
  if (!value) {
    return defaultSettings.fontFamily;
  }
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
  return cleaned.includes(' ') ? `"${cleaned}"` : cleaned;
}

function getScopeInfo() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) {
    const search = new URLSearchParams(window.location.search);
    const playlistId = search.get('list');
    if (playlistId) {
      return {
        key: `youtube:playlist:${playlistId}`,
        label: `Playlist: ${playlistId}`,
        type: 'playlist'
      };
    }

    const channelMeta = document.querySelector('meta[itemprop="channelId"]');
    if (channelMeta && channelMeta.content) {
      return {
        key: `youtube:channel:${channelMeta.content}`,
        label: `Channel: ${channelMeta.content}`,
        type: 'channel'
      };
    }

    const channelLink = document.querySelector('ytd-channel-name a, #owner-name a');
    if (channelLink && channelLink.href) {
      const path = channelLink.href.replace('https://www.youtube.com/', '').replace(/\?.*$/, '');
      return {
        key: `youtube:channel:${path}`,
        label: `Channel: ${path}`,
        type: 'channel'
      };
    }
  }

  return {
    key: hostname,
    label: hostname,
    type: 'global'
  };
}

function getEffectiveSettings(storageResult, scopeKey) {
  const globalSettings = {
    enabled: storageResult.enabled !== undefined ? storageResult.enabled : defaultSettings.enabled,
    fontFamily: storageResult.fontFamily || defaultSettings.fontFamily,
    fontSize: storageResult.fontSize || defaultSettings.fontSize,
    textColor: storageResult.textColor || defaultSettings.textColor,
    textShadow: storageResult.textShadow || defaultSettings.textShadow,
    backgroundOpacity: storageResult.backgroundOpacity || defaultSettings.backgroundOpacity
  };

  const scopedSettings = storageResult.scopedSettings && storageResult.scopedSettings[scopeKey] ? storageResult.scopedSettings[scopeKey] : {};
  return {
    enabled: scopedSettings.enabled !== undefined ? scopedSettings.enabled : globalSettings.enabled,
    fontFamily: scopedSettings.fontFamily || globalSettings.fontFamily,
    fontSize: scopedSettings.fontSize || globalSettings.fontSize,
    textColor: scopedSettings.textColor || globalSettings.textColor,
    textShadow: scopedSettings.textShadow || globalSettings.textShadow,
    backgroundOpacity: scopedSettings.backgroundOpacity || globalSettings.backgroundOpacity
  };
}

function applyCaptionStyles() {
  const scopeInfo = getScopeInfo();
  chrome.storage.sync.get(['enabled', 'fontFamily', 'fontSize', 'textColor', 'textShadow', 'backgroundOpacity', 'scopedSettings'], function(result) {
    const settings = getEffectiveSettings(result, scopeInfo.key);
    const style = ensureCaptionStyleElement();

    if (!settings.enabled) {
      style.textContent = '';
      return;
    }

    style.textContent = `
      .ytp-caption-window-container,
      .ytp-caption-window-container .ytp-caption-segment,
      .ytp-caption-window-container .ytp-caption-segment span,
      .ytp-caption-window-container span {
        font-family: ${getCssFontFamily(settings.fontFamily)} !important;
        font-size: ${settings.fontSize} !important;
        color: ${settings.textColor} !important;
        text-shadow: ${settings.textShadow} !important;
      }
      .ytp-caption-window-container {
        background-color: transparent !important;
        z-index: 9999 !important;
      }
      .ytp-caption-window-container .ytp-caption-segment,
      .ytp-caption-window-container .ytp-caption-segment span,
      .ytp-caption-window-container span {
        background-color: rgba(0, 0, 0, ${settings.backgroundOpacity}) !important;
      }
    `;
  });
}

function createDropdown(id, labelText, values) {
  const label = document.createElement('label');
  label.textContent = labelText;
  label.style.display = 'block';
  label.style.margin = '8px 0 4px';
  label.style.color = '#fff';

  const select = document.createElement('select');
  select.id = id;
  select.style.width = '100%';
  select.style.padding = '6px 8px';
  select.style.borderRadius = '4px';
  select.style.border = '1px solid #444';
  select.style.background = '#181818';
  select.style.color = '#fff';

  values.forEach(value => {
    const option = document.createElement('option');
    if (typeof value === 'object') {
      option.value = value.value;
      option.textContent = value.label;
    } else {
      option.value = value;
      option.textContent = value;
    }
    select.appendChild(option);
  });

  label.appendChild(select);
  return label;
}

function loadCustomizerPanelSettings() {
  const scopeInfo = getScopeInfo();
  chrome.storage.sync.get(['enabled', 'fontFamily', 'fontSize', 'textColor', 'textShadow', 'backgroundOpacity', 'scopedSettings'], function(result) {
    const scoped = result.scopedSettings && result.scopedSettings[scopeInfo.key] ? result.scopedSettings[scopeInfo.key] : {};
    const enabled = scoped.enabled !== undefined ? scoped.enabled : (result.enabled !== undefined ? result.enabled : true);
    const fontFamily = scoped.fontFamily || result.fontFamily || defaultSettings.fontFamily;
    const fontSize = scoped.fontSize ? parseInt(scoped.fontSize, 10) : (result.fontSize ? parseInt(result.fontSize, 10) : parseInt(defaultSettings.fontSize, 10));
    const textColor = scoped.textColor || result.textColor || defaultSettings.textColor;
    const textShadow = scoped.textShadow || result.textShadow || defaultSettings.textShadow;
    const backgroundOpacity = scoped.backgroundOpacity || result.backgroundOpacity || defaultSettings.backgroundOpacity;

    document.getElementById('enabled').checked = enabled;
    document.getElementById('fontFamily').value = fontFamily;
    document.getElementById('fontSize').value = fontSize;
    document.getElementById('fontSizeLabel').textContent = `Font size: ${fontSize}px`;
    document.getElementById('textColor').value = textColor;
    document.getElementById('textShadow').value = textShadow;
    document.getElementById('backgroundOpacity').value = parseFloat(backgroundOpacity) * 100;
    document.getElementById('backgroundOpacityLabel').textContent = `Background opacity: ${parseFloat(backgroundOpacity) * 100}%`;
    document.getElementById('scopeInfo').textContent = `Scope: ${scopeInfo.label}`;
    document.getElementById('saveScope').disabled = scopeInfo.type === 'global';
    if (scopeInfo.type === 'global') {
      document.getElementById('saveScope').checked = false;
    }
  });
}

function buildCustomizerPanel() {
  if (document.getElementById('cc-customizer-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'cc-customizer-panel';
  panel.style.position = 'fixed';
  panel.style.width = '260px';
  panel.style.padding = '14px';
  panel.style.background = 'rgba(18, 18, 18, 0.98)';
  panel.style.border = '1px solid rgba(255,255,255,0.14)';
  panel.style.borderRadius = '14px';
  panel.style.boxShadow = '0 14px 28px rgba(0,0,0,0.45)';
  panel.style.color = '#fff';
  panel.style.zIndex = '999999';
  panel.style.display = 'none';
  panel.style.flexDirection = 'column';
  panel.style.fontFamily = 'Arial, sans-serif';

  const title = document.createElement('div');
  title.textContent = 'Caption Options';
  title.style.fontSize = '14px';
  title.style.fontWeight = '700';
  title.style.marginBottom = '12px';
  panel.appendChild(title);

  panel.appendChild(createDropdown('fontFamily', 'Font family', [
    'Arial',
    'Verdana',
    'Times New Roman',
    'Courier New',
    'Georgia'
  ]));

  const fontSizeLabel = document.createElement('label');
  fontSizeLabel.textContent = 'Font size: 16px';
  fontSizeLabel.style.display = 'block';
  fontSizeLabel.style.margin = '10px 0 6px';
  fontSizeLabel.style.color = '#fff';
  fontSizeLabel.id = 'fontSizeLabel';

  const fontSizeSlider = document.createElement('input');
  fontSizeSlider.type = 'range';
  fontSizeSlider.id = 'fontSize';
  fontSizeSlider.min = '12';
  fontSizeSlider.max = '42';
  fontSizeSlider.step = '2';
  fontSizeSlider.value = '16';
  fontSizeSlider.style.width = '100%';
  fontSizeSlider.style.marginBottom = '6px';

  fontSizeSlider.addEventListener('input', function() {
    fontSizeLabel.textContent = `Font size: ${fontSizeSlider.value}px`;
  });

  panel.appendChild(fontSizeLabel);
  panel.appendChild(fontSizeSlider);

  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Text color';
  colorLabel.style.display = 'block';
  colorLabel.style.margin = '10px 0 6px';
  colorLabel.style.color = '#fff';

  const textColorInput = document.createElement('input');
  textColorInput.type = 'color';
  textColorInput.id = 'textColor';
  textColorInput.value = '#ffffff';
  textColorInput.style.width = '100%';
  textColorInput.style.height = '32px';
  textColorInput.style.border = '1px solid #444';
  textColorInput.style.borderRadius = '6px';
  textColorInput.style.background = '#181818';

  colorLabel.appendChild(textColorInput);
  panel.appendChild(colorLabel);

  panel.appendChild(createDropdown('textShadow', 'Text shadow (outline for readability)', [
    { value: 'none', label: 'None' },
    { value: '0 0 4px rgba(0,0,0,0.75)', label: 'Light outline' },
    { value: '0 0 8px rgba(0,0,0,0.85)', label: 'Stronger outline' },
    { value: '0 0 2px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)', label: 'Bold outline' }
  ]));

  const backgroundOpacityLabel = document.createElement('label');
  backgroundOpacityLabel.textContent = 'Background opacity: 70%';
  backgroundOpacityLabel.style.display = 'block';
  backgroundOpacityLabel.style.margin = '10px 0 6px';
  backgroundOpacityLabel.style.color = '#fff';
  backgroundOpacityLabel.id = 'backgroundOpacityLabel';

  const backgroundOpacitySlider = document.createElement('input');
  backgroundOpacitySlider.type = 'range';
  backgroundOpacitySlider.id = 'backgroundOpacity';
  backgroundOpacitySlider.min = '0';
  backgroundOpacitySlider.max = '100';
  backgroundOpacitySlider.step = '5';
  backgroundOpacitySlider.value = '70';
  backgroundOpacitySlider.style.width = '100%';
  backgroundOpacitySlider.style.marginBottom = '6px';

  backgroundOpacitySlider.addEventListener('input', function() {
    backgroundOpacityLabel.textContent = `Background opacity: ${backgroundOpacitySlider.value}%`;
  });

  panel.appendChild(backgroundOpacityLabel);
  panel.appendChild(backgroundOpacitySlider);

  const enabledLabel = document.createElement('label');
  enabledLabel.style.display = 'flex';
  enabledLabel.style.alignItems = 'center';
  enabledLabel.style.margin = '10px 0 6px';
  enabledLabel.style.color = '#fff';

  const enabledCheckbox = document.createElement('input');
  enabledCheckbox.type = 'checkbox';
  enabledCheckbox.id = 'enabled';
  enabledCheckbox.checked = true;
  enabledCheckbox.style.marginRight = '8px';

  enabledLabel.appendChild(enabledCheckbox);
  enabledLabel.appendChild(document.createTextNode('Enable custom captions'));
  panel.appendChild(enabledLabel);

  const scopeInfo = document.createElement('div');
  scopeInfo.id = 'scopeInfo';
  scopeInfo.style.fontSize = '12px';
  scopeInfo.style.margin = '8px 0 10px';
  scopeInfo.style.color = '#ccc';
  panel.appendChild(scopeInfo);

  const saveScopeLabel = document.createElement('label');
  saveScopeLabel.style.display = 'flex';
  saveScopeLabel.style.alignItems = 'center';
  saveScopeLabel.style.margin = '4px 0 10px';
  saveScopeLabel.style.color = '#fff';

  const saveScopeCheckbox = document.createElement('input');
  saveScopeCheckbox.type = 'checkbox';
  saveScopeCheckbox.id = 'saveScope';
  saveScopeCheckbox.checked = true;
  saveScopeCheckbox.style.marginRight = '8px';

  saveScopeLabel.appendChild(saveScopeCheckbox);
  saveScopeLabel.appendChild(document.createTextNode('Save for this channel/playlist if available'));
  panel.appendChild(saveScopeLabel);

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Settings';
  saveButton.style.marginTop = '8px';
  saveButton.style.width = '100%';
  saveButton.style.padding = '10px 12px';
  saveButton.style.background = '#ff0000';
  saveButton.style.color = '#fff';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '8px';
  saveButton.style.cursor = 'pointer';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Restore defaults';
  resetButton.style.marginTop = '10px';
  resetButton.style.width = '100%';
  resetButton.style.padding = '10px 12px';
  resetButton.style.background = '#444';
  resetButton.style.color = '#fff';
  resetButton.style.border = 'none';
  resetButton.style.borderRadius = '8px';
  resetButton.style.cursor = 'pointer';

  panel.appendChild(saveButton);
  panel.appendChild(resetButton);
  document.body.appendChild(panel);
  loadCustomizerPanelSettings();

  saveButton.addEventListener('click', function() {
    const panelRoot = document.getElementById('cc-customizer-panel');
    const settings = {
      enabled: panelRoot.querySelector('#enabled').checked,
      fontFamily: panelRoot.querySelector('#fontFamily').value,
      fontSize: `${panelRoot.querySelector('#fontSize').value}px`,
      textColor: panelRoot.querySelector('#textColor').value,
      textShadow: panelRoot.querySelector('#textShadow').value,
      backgroundOpacity: `${panelRoot.querySelector('#backgroundOpacity').value / 100}`
    };

    const scopeInfoValue = getScopeInfo();
    chrome.storage.sync.get(['scopedSettings'], function(result) {
      const scopedSettings = result.scopedSettings || {};
      if (panelRoot.querySelector('#saveScope').checked && scopeInfoValue.type !== 'global') {
        scopedSettings[scopeInfoValue.key] = settings;
      } else {
        if (scopedSettings[scopeInfoValue.key]) {
          delete scopedSettings[scopeInfoValue.key];
        }
      }

      chrome.storage.sync.set({
        enabled: settings.enabled,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        textColor: settings.textColor,
        textShadow: settings.textShadow,
        backgroundOpacity: settings.backgroundOpacity,
        scopedSettings
      }, function() {
        applyCaptionStyles();
        loadCustomizerPanelSettings();
        saveButton.textContent = 'Saved!';
        setTimeout(() => saveButton.textContent = 'Save Settings', 900);
      });
    });
  });

  resetButton.addEventListener('click', function() {
    const panelRoot = document.getElementById('cc-customizer-panel');
    const scopeInfoValue = getScopeInfo();
    const scopedSettings = {};
    chrome.storage.sync.get(['scopedSettings'], function(result) {
      if (result.scopedSettings) {
        Object.assign(scopedSettings, result.scopedSettings);
      }
      if (scopedSettings[scopeInfoValue.key]) {
        delete scopedSettings[scopeInfoValue.key];
      }

      chrome.storage.sync.set({
        enabled: defaultSettings.enabled,
        fontFamily: defaultSettings.fontFamily,
        fontSize: defaultSettings.fontSize,
        textColor: defaultSettings.textColor,
        textShadow: defaultSettings.textShadow,
        backgroundOpacity: defaultSettings.backgroundOpacity,
        scopedSettings
      }, function() {
        loadCustomizerPanelSettings();
        applyCaptionStyles();
      });
    });
  });

  return panel;
}

function createCustomizerToggle(ccButton) {
  if (document.getElementById('cc-customizer-toggle')) return;

  const toggle = document.createElement('button');
  toggle.id = 'cc-customizer-toggle';
  toggle.type = 'button';
  toggle.textContent = '⚙';
  toggle.title = 'Caption customizer';
  toggle.style.marginLeft = '6px';
  toggle.style.width = '36px';
  toggle.style.height = '36px';
  toggle.style.minWidth = '36px';
  toggle.style.borderRadius = '50%';
  toggle.style.border = '1px solid rgba(255,255,255,0.12)';
  toggle.style.background = 'rgba(255,255,255,0.06)';
  toggle.style.color = '#fff';
  toggle.style.cursor = 'pointer';
  toggle.style.display = 'flex';
  toggle.style.alignItems = 'center';
  toggle.style.justifyContent = 'center';
  toggle.style.fontSize = '16px';
  toggle.style.lineHeight = '1';
  toggle.style.boxShadow = 'none';
  toggle.style.transition = 'background 0.2s ease';
  toggle.addEventListener('mouseenter', () => toggle.style.background = 'rgba(255,255,255,0.12)');
  toggle.addEventListener('mouseleave', () => toggle.style.background = 'rgba(255,255,255,0.06)');

  const panel = document.getElementById('cc-customizer-panel');
  if (!panel) return;

  toggle.addEventListener('click', function(event) {
    event.stopPropagation();
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    if (panel.style.display === 'flex') {
      const ccButton = document.querySelector('.ytp-subtitles-button, button[aria-label*="Captions"], button[aria-label*="Subtitrări"], button[aria-label*="Subtitles"]');
      const playerControls = document.querySelector('.ytp-chrome-bottom');

      if (ccButton && playerControls) {
        const ccButtonRect = ccButton.getBoundingClientRect();
        const controlsRect = playerControls.getBoundingClientRect();
        
        panel.style.right = `${window.innerWidth - ccButtonRect.right}px`; 
        panel.style.bottom = `${controlsRect.height + 10}px`; 
        panel.style.left = 'auto';
        panel.style.top = 'auto';
      } else {
        panel.style.right = '10px';
        panel.style.bottom = '50px'; 
        panel.style.left = 'auto';
        panel.style.top = 'auto';
      }
    }
  });

  document.addEventListener('click', function(evt) {
    if (!panel.contains(evt.target) && evt.target !== toggle) {
      panel.style.display = 'none';
    }
  });

  ccButton.parentNode.insertBefore(toggle, ccButton.nextSibling);
}

function initializeCustomizer() {
  const ccButton = document.querySelector('.ytp-subtitles-button, button[aria-label*="Captions"], button[aria-label*="Subtitrări"], button[aria-label*="Subtitles"]');
  if (!ccButton) return;

  buildCustomizerPanel();
  createCustomizerToggle(ccButton);
  applyCaptionStyles();
}

const observer = new MutationObserver(() => {
  initializeCustomizer();
});

observer.observe(document.body, { childList: true, subtree: true });

applyCaptionStyles();
chrome.storage.onChanged.addListener(applyCaptionStyles);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'getScopeInfo') {
    sendResponse(getScopeInfo());
  }
});
