/**
 * Popup Script
 * Displays extension status and provides quick access to settings
 */

document.addEventListener('DOMContentLoaded', async () => {
  const tokenStatus = document.getElementById('tokenStatus');
  const openSettingsBtn = document.getElementById('openSettings');

  // Check if token is configured
  try {
    const stored = await browser.storage.sync.get('github_token');

    if (stored.github_token && stored.github_token.length > 0) {
      tokenStatus.textContent = '✅ Configured';
      tokenStatus.className = 'status-value status-configured';
    } else {
      tokenStatus.textContent = 'ℹ️ Not set';
      tokenStatus.className = 'status-value status-not-set';
    }
  } catch (error) {
    console.error('[Popup] Failed to check token status:', error);
    tokenStatus.textContent = '❌ Error';
    tokenStatus.className = 'status-value status-error';
  }

  // Open settings page when button is clicked
  openSettingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});
