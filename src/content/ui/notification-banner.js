/**
 * Notification Banner
 * Shows a one-time global notification about token feature for private repos
 * Dismissible with 7-day cooldown
 */

const NOTIFICATION_DISMISSED_KEY = 'notification_dismissed_timestamp';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Checks if the notification should be shown
 * @returns {Promise<boolean>} True if notification should be displayed
 */
async function shouldShowNotification() {
  // Check if we're on a private repo (imported from repo-detector.js)
  const isPrivate = isPrivateRepo();
  if (!isPrivate) {
    return false;
  }

  // Check if token is already configured
  try {
    const stored = await chrome.storage.sync.get('github_token');
    if (stored.github_token && stored.github_token.length > 0) {
      return false; // Token already set, no need to show notification
    }
  } catch (error) {
    console.error('[Notification] Failed to check token status:', error);
    return false;
  }

  // Check dismissal timestamp
  try {
    const dismissed = await chrome.storage.local.get(NOTIFICATION_DISMISSED_KEY);

    if (!dismissed[NOTIFICATION_DISMISSED_KEY]) {
      return true; // Never dismissed, show it
    }

    // Check if 7 days have passed since dismissal
    const timeSinceDismissal = Date.now() - dismissed[NOTIFICATION_DISMISSED_KEY];
    if (timeSinceDismissal >= SEVEN_DAYS_MS) {
      return true; // 7 days passed, show again
    }

    return false; // Recently dismissed
  } catch (error) {
    console.error('[Notification] Failed to check dismissal status:', error);
    return false;
  }
}

/**
 * Creates and shows the token notification banner
 */
async function showTokenNotification() {
  const shouldShow = await shouldShowNotification();

  if (!shouldShow) {
    console.log('[Notification] Skipping notification (criteria not met)');
    return;
  }

  console.log('[Notification] Showing token notification banner');

  // Create notification banner
  const banner = document.createElement('div');
  banner.className = 'github-folders-notification';
  banner.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">💡</span>
      <span class="notification-text">
        This extension works better with private repos when you add a GitHub token
      </span>
      <div class="notification-actions">
        <button class="notification-btn notification-configure" type="button">Configure</button>
        <button class="notification-btn notification-dismiss" type="button">Dismiss</button>
      </div>
    </div>
  `;

  // Add event listeners
  banner.querySelector('.notification-configure').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    dismissNotification();
  });

  banner.querySelector('.notification-dismiss').addEventListener('click', () => {
    dismissNotification();
  });

  // Insert at top of page (after any GitHub headers)
  const targetContainer = document.querySelector('.js-flash-container') || document.body;
  targetContainer.insertBefore(banner, targetContainer.firstChild);
}

/**
 * Dismisses and removes the notification banner
 */
async function dismissNotification() {
  const banner = document.querySelector('.github-folders-notification');
  if (banner) {
    banner.remove();
    console.log('[Notification] Banner dismissed');
  }

  // Save dismissal timestamp
  try {
    await chrome.storage.local.set({
      [NOTIFICATION_DISMISSED_KEY]: Date.now()
    });
    console.log('[Notification] Dismissal timestamp saved');
  } catch (error) {
    console.error('[Notification] Failed to save dismissal timestamp:', error);
  }
}

/**
 * Clears the dismissal timestamp (for testing or manual reset)
 */
async function resetNotificationDismissal() {
  await chrome.storage.local.remove(NOTIFICATION_DISMISSED_KEY);
  console.log('[Notification] Dismissal timestamp cleared');
}
