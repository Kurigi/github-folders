/**
 * Messaging Service
 * Abstraction over Chrome Runtime Messaging API
 * Follows Dependency Inversion Principle - provides abstraction for service worker communication
 */

/**
 * Sends a message to the service worker and waits for response
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from service worker
 */
async function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Fetches workflows from GitHub API via service worker
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Response with workflows or error
 */
async function fetchWorkflows(owner, repo) {
  try {
    const response = await sendMessage({
      action: 'fetchWorkflows',
      owner,
      repo
    });

    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches the configuration for the current repository via service worker
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Response with config or error
 */
async function fetchConfig(owner, repo) {
  try {
    const response = await sendMessage({
      action: 'fetchConfig',
      owner,
      repo
    });

    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (error) {
    throw error;
  }
}
