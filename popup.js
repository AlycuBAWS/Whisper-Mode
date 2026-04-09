document.addEventListener('DOMContentLoaded', function() {
  const fontSizeInput = document.getElementById('fontSize');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const backgroundOpacityInput = document.getElementById('backgroundOpacity');
  const backgroundOpacityValue = document.getElementById('backgroundOpacityValue');
  const scopeInfo = document.getElementById('scopeInfo');
  let currentScope = { key: 'global', label: 'global', type: 'global' };

  fontSizeInput.addEventListener('input', function() {
    fontSizeValue.textContent = `${fontSizeInput.value}px`;
  });

  backgroundOpacityInput.addEventListener('input', function() {
    backgroundOpacityValue.textContent = `${backgroundOpacityInput.value}%`;
  });

  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'fontFamily', 'fontSize', 'textColor', 'textShadow', 'backgroundOpacity', 'scopedSettings'], function(result) {
      const scoped = result.scopedSettings && result.scopedSettings[currentScope.key] ? result.scopedSettings[currentScope.key] : {};
      const enabled = scoped.enabled !== undefined ? scoped.enabled : (result.enabled !== undefined ? result.enabled : true);
      const fontFamily = scoped.fontFamily || result.fontFamily || 'Arial';
      const fontSize = scoped.fontSize ? parseInt(scoped.fontSize, 10) : (result.fontSize ? parseInt(result.fontSize, 10) : 16);
      const textColor = scoped.textColor || result.textColor || '#ffffff';
      const textShadow = scoped.textShadow || result.textShadow || 'none';
      const backgroundOpacity = scoped.backgroundOpacity || result.backgroundOpacity || '0.7';

      document.getElementById('enabled').checked = enabled;
      document.getElementById('fontFamily').value = fontFamily;
      fontSizeInput.value = fontSize;
      fontSizeValue.textContent = `${fontSize}px`;
      document.getElementById('textColor').value = textColor;
      document.getElementById('textShadow').value = textShadow;
      backgroundOpacityInput.value = parseFloat(backgroundOpacity) * 100;
      backgroundOpacityValue.textContent = `${parseFloat(backgroundOpacity) * 100}%`;
    });
  }

  function updateScopeInfo(scope) {
    currentScope = scope;
    scopeInfo.textContent = `Scope: ${scope.label}`;
    document.getElementById('saveScope').disabled = scope.type === 'global';
    if (scope.type === 'global') {
      document.getElementById('saveScope').checked = false;
    }
  }

  function requestScopeInfo() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs[0]) {
        updateScopeInfo({ key: 'global', label: 'global', type: 'global' });
        loadSettings();
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'getScopeInfo' }, function(response) {
        if (chrome.runtime.lastError || !response) {
          updateScopeInfo({ key: 'global', label: 'global', type: 'global' });
        } else {
          updateScopeInfo(response);
        }
        loadSettings();
      });
    });
  }

  document.getElementById('save').addEventListener('click', function() {
    const settings = {
      enabled: document.getElementById('enabled').checked,
      fontFamily: document.getElementById('fontFamily').value,
      fontSize: `${fontSizeInput.value}px`,
      textColor: document.getElementById('textColor').value,
      textShadow: document.getElementById('textShadow').value,
      backgroundOpacity: `${backgroundOpacityInput.value / 100}`
    };

    chrome.storage.sync.get(['scopedSettings'], function(result) {
      const scopedSettings = result.scopedSettings || {};
      if (document.getElementById('saveScope').checked && currentScope.type !== 'global') {
        scopedSettings[currentScope.key] = settings;
      } else if (scopedSettings[currentScope.key]) {
        delete scopedSettings[currentScope.key];
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
        document.getElementById('save').textContent = 'Saved!';
        setTimeout(() => document.getElementById('save').textContent = 'Save Settings', 900);
      });
    });
  });

  document.getElementById('restore').addEventListener('click', function() {
    const defaults = {
      enabled: true,
      fontFamily: 'Arial',
      fontSize: '16px',
      textColor: '#ffffff',
      textShadow: 'none',
      backgroundOpacity: '0.7'
    };

    chrome.storage.sync.get(['scopedSettings'], function(result) {
      const scopedSettings = result.scopedSettings || {};
      if (scopedSettings[currentScope.key]) {
        delete scopedSettings[currentScope.key];
      }
      chrome.storage.sync.set({
        enabled: defaults.enabled,
        fontFamily: defaults.fontFamily,
        fontSize: defaults.fontSize,
        textColor: defaults.textColor,
        textShadow: defaults.textShadow,
        backgroundOpacity: defaults.backgroundOpacity,
        scopedSettings
      }, function() {
        document.getElementById('enabled').checked = defaults.enabled;
        document.getElementById('fontFamily').value = defaults.fontFamily;
        fontSizeInput.value = parseInt(defaults.fontSize, 10);
        fontSizeValue.textContent = `${defaults.fontSize}`;
        document.getElementById('textColor').value = defaults.textColor;
        document.getElementById('textShadow').value = defaults.textShadow;
        backgroundOpacityInput.value = parseFloat(defaults.backgroundOpacity) * 100;
        backgroundOpacityValue.textContent = `${parseFloat(defaults.backgroundOpacity) * 100}%`;
      });
    });
  });

  requestScopeInfo();
});