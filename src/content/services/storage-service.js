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

/**
 * Gets the folder states for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Object mapping folder names to expanded state (true = expanded, false = collapsed)
 */
async function getFolderStates(owner, repo) {
  const key = `folder_states_${owner}_${repo}`;
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      // Default to empty object if not set
      resolve(result[key] || {});
    });
  });
}

/**
 * Sets the state for a specific folder in a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} folderName - Name of the folder
 * @param {boolean} isExpanded - Whether the folder is expanded
 * @returns {Promise<void>}
 */
async function setFolderState(owner, repo, folderName, isExpanded) {
  const key = `folder_states_${owner}_${repo}`;

  // Get current states
  const states = await getFolderStates(owner, repo);

  // Update the specific folder state
  states[folderName] = isExpanded;

  // Save back to storage
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: states }, () => {
      resolve();
    });
  });
}
