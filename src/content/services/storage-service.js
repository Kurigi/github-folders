/**
 * Storage Service
 * Abstraction over Chrome Storage API
 */

/**
 * Gets the enabled state for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if enabled, false if disabled
 */
async function getExtensionEnabled(owner, repo) {
  const key = `enabled_${owner}_${repo}`;
  const result = await browser.storage.local.get(key);
  return result[key] !== false;
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
  await browser.storage.local.set({ [key]: enabled });
}

/**
 * Gets the folder states for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Object mapping folder names to expanded state (true = expanded, false = collapsed)
 */
async function getFolderStates(owner, repo) {
  const key = `folder_states_${owner}_${repo}`;
  const result = await browser.storage.local.get(key);
  return result[key] || {};
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
  const states = await getFolderStates(owner, repo);
  states[folderName] = isExpanded;
  await browser.storage.local.set({ [key]: states });
}

/**
 * Gets all repositories that have saved folder states
 * @returns {Promise<Array<{owner: string, repo: string}>>} Array of repository info
 */
async function getAllRepositoriesWithStates() {
  const items = await browser.storage.local.get(null);
  const repos = [];

  for (const key in items) {
    if (key.startsWith('folder_states_')) {
      const parts = key.replace('folder_states_', '').split('_');
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts.slice(1).join('_');
        repos.push({ owner, repo });
      }
    }
  }

  return repos;
}

/**
 * Clears folder states for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
async function clearFolderStatesForRepo(owner, repo) {
  const key = `folder_states_${owner}_${repo}`;
  await browser.storage.local.remove(key);
}
