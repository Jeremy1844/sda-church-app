const guidance = (platform, steps) => Object.freeze({
  platform,
  steps: Object.freeze(steps),
});

const GENERIC_GUIDANCE = guidance('this browser', [
  'Open the browser menu or share controls.',
  'Choose Install app or Add to Home Screen if it is offered.',
  'Review the name and address, then confirm. Browser wording can vary.',
]);

/**
 * Provides conservative English manual steps without claiming that a browser supports
 * installation. The browser remains the source of truth for which controls are offered.
 */
export function resolvePwaInstallGuidance(userAgent = '') {
  const normalized = String(userAgent);
  const isiOS = /iPad|iPhone|iPod/i.test(normalized);
  const isAndroid = /Android/i.test(normalized);
  const isEdge = /Edg(?:A|iOS)?\//i.test(normalized);
  const isFirefox = /Firefox|FxiOS/i.test(normalized);
  const isChromium = /Chrome|CriOS/i.test(normalized) && !isEdge;
  const isSafari = /Safari/i.test(normalized) && !/Chrome|CriOS|Chromium|Edg|Firefox|FxiOS/i.test(normalized);
  const isMac = /Macintosh|Mac OS X/i.test(normalized);
  const isWindows = /Windows NT/i.test(normalized);

  if (isiOS) {
    return guidance('iPhone or iPad', [
      'Open this page in Safari if your current browser does not show a home-screen action.',
      'Tap Safari’s Share button, then choose Add to Home Screen. It may appear under More or Edit Actions.',
      'Turn on Open as Web App, review the app name and website address, then tap Add.',
    ]);
  }

  if (isAndroid && (isChromium || isEdge)) {
    return guidance(isEdge ? 'Microsoft Edge on Android' : 'Chrome on Android', [
      'Open the browser’s three-dot menu.',
      'Choose Add to home screen, then Install, if those actions are offered.',
      'Review the app name and website address, then confirm.',
    ]);
  }

  if (isAndroid && isFirefox) {
    return guidance('Firefox on Android', [
      'Open the browser’s three-dot menu.',
      'Choose Install or Add to Home screen if it is offered.',
      'Review the app name and website address, then confirm.',
    ]);
  }

  if (isMac && isSafari) {
    return guidance('Safari on Mac', [
      'Use Safari’s Share button in the toolbar.',
      'Choose Add to Dock if that action is available in your macOS version.',
      'Review the app name and website address, then confirm.',
    ]);
  }

  if (isChromium || isEdge) {
    return guidance(isEdge ? 'Microsoft Edge' : 'Chrome', [
      'Use the install icon in the address bar, if shown, or open the browser menu.',
      'Choose Install this site as an app or Install app. Wording varies by browser version.',
      'Review the app name and website address, then confirm.',
    ]);
  }

  if (isFirefox && isWindows) {
    return guidance('Firefox on Windows', [
      'Use the web apps button in the address bar if Firefox offers it for this page.',
      'Firefox adds the web app to the Windows taskbar and Start menu.',
      'Only proceed if the browser shows the expected website address.',
    ]);
  }

  if (isFirefox) {
    return guidance('Firefox on this desktop', [
      'Firefox currently offers its desktop web-app feature only on Windows.',
      'You can bookmark this page, or open the same address in a browser that offers an install action on this platform.',
      'Only proceed if the browser shows the expected website address.',
    ]);
  }

  return GENERIC_GUIDANCE;
}
