/**
 * Storage Service
 * Abstraction over Chrome Storage API
 * Follows Dependency Inversion Principle - provides abstraction for storage operations
 */

/**
 * Gets the enabled state for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if enabled, false if disabled
 */
async function getExtensionEnabled(owner, repo) {
  const key = `enabled_${owner}_${repo}`;
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      // Default to enabled if not set
      resolve(result[key] !== false);
    });
  });
}

/**
 * Sets the enabled state for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {boolean} enabled - Whether extension is enabled
 * @returns {Promise<void>}
 */
async function setExtensionEnabled(owner, repo, enabled) {
  const key = `enabled_${owner}_${repo}`;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: enabled }, () => {
      resolve();
    });
  });
}
