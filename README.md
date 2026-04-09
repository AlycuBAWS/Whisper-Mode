# Closed Captions Customizer Chrome Extension

This extension allows you to customize closed captions on web pages by changing font, size, and position.

## Installation

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right.
3. Click "Load unpacked" and select this folder.
4. The extension is now installed.

## Usage

- Click the extension icon to open the popup and set your preferences.
- Alternatively, go to the options page via the extension details.
- Settings are saved and applied to caption elements on pages.

## Notes

- Caption detection is basic; it targets elements with classes containing 'caption' or 'subtitle'.
- For better accuracy, the selector in content.js may need adjustment for specific sites.
- Icons are placeholders; replace with actual PNG images.

## Development

- Edit the files as needed.
- Reload the extension in `chrome://extensions/` after changes.