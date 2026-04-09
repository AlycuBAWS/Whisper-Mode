document.addEventListener('DOMContentLoaded', function() {
  const fontSizeInput = document.getElementById('fontSize');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const backgroundOpacityInput = document.getElementById('backgroundOpacity');
  const backgroundOpacityValue = document.getElementById('backgroundOpacityValue');

  fontSizeInput.addEventListener('input', function() {
    fontSizeValue.textContent = `${fontSizeInput.value}px`;
  });

  backgroundOpacityInput.addEventListener('input', function() {
    backgroundOpacityValue.textContent = `${backgroundOpacityInput.value}%`;
  });

  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'fontFamily', 'fontSize', 'textColor', 'textShadow', 'backgroundOpacity'], function(result) {
      const enabled = result.enabled !== undefined ? result.enabled : true;
      const fontFamily = result.fontFamily || 'Arial';
      const fontSize = result.fontSize ? parseInt(result.fontSize, 10) : 16;
      const textColor = result.textColor || '#ffffff';
      const textShadow = result.textShadow || 'none';
      const backgroundOpacity = result.backgroundOpacity || '0.7';

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

  document.getElementById('save').addEventListener('click', function() {
    const settings = {
      enabled: document.getElementById('enabled').checked,
      fontFamily: document.getElementById('fontFamily').value,
      fontSize: `${fontSizeInput.value}px`,
      textColor: document.getElementById('textColor').value,
      textShadow: document.getElementById('textShadow').value,
      backgroundOpacity: `${backgroundOpacityInput.value / 100}`
    };
    chrome.storage.sync.set(settings, function() {
      document.getElementById('save').textContent = 'Saved!';
      setTimeout(() => document.getElementById('save').textContent = 'Save Settings', 900);
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
    chrome.storage.sync.set(defaults, function() {
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

  loadSettings();
});