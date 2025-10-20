/**
 * Background Service Worker
 * Handles communication between content scripts and GitHub API
 */

// Import utilities (note: in Manifest V3, we need to use importScripts or inline code)
// For simplicity, we'll inline the essential functions here

const CONFIG_FILE_PATH = '.github/actions-folders.json';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Builds the raw GitHub URL for the config file
 */
function buildRawGitHubUrl(owner, repo, branch = 'main') {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${CONFIG_FILE_PATH}`;
}

/**
 * Fetches all workflows from GitHub API
 */
async function fetchWorkflows(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;
  console.log(`[Service Worker] Fetching workflows from API: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Service Worker] Found ${data.workflows.length} workflows`);

    return {
      success: true,
      workflows: data.workflows
    };
  } catch (error) {
    console.error('[Service Worker] Failed to fetch workflows:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Attempts to fetch the config file from multiple default branches
 */
async function fetchConfigFromBranches(owner, repo) {
  const branches = ['main', 'master'];

  for (const branch of branches) {
    try {
      const url = buildRawGitHubUrl(owner, repo, branch);
      console.log(`[Service Worker] Fetching config from: ${url}`);

      const response = await fetch(url);

      if (response.ok) {
        const content = await response.json();
        console.log(`[Service Worker] Config found on branch: ${branch}`);
        return content;
      }
    } catch (error) {
      console.warn(`[Service Worker] Failed to fetch from ${branch}:`, error);
      continue;
    }
  }

  throw new Error('Config file not found in any default branch');
}

/**
 * Fetches config with caching support
 */
async function fetchConfigWithCache(owner, repo) {
  const cacheKey = `config_${owner}_${repo}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;

  try {
    // Check cache
    const cached = await chrome.storage.local.get([cacheKey, cacheTimestampKey]);
    const cachedContent = cached[cacheKey];
    const cachedTimestamp = cached[cacheTimestampKey];

    // Return cached if valid
    if (cachedContent && cachedTimestamp) {
      const age = Date.now() - cachedTimestamp;
      if (age < CACHE_DURATION_MS) {
        console.log(`[Service Worker] Using cached config for ${owner}/${repo} (age: ${Math.round(age / 1000)}s)`);
        return {
          success: true,
          content: cachedContent,
          fromCache: true
        };
      }
    }

    // Fetch fresh content
    console.log(`[Service Worker] Fetching fresh config for ${owner}/${repo}`);
    const content = await fetchConfigFromBranches(owner, repo);

    // Cache the result
    await chrome.storage.local.set({
      [cacheKey]: content,
      [cacheTimestampKey]: Date.now()
    });

    return {
      success: true,
      content: content
    };
  } catch (error) {
    console.warn(`[Service Worker] Failed to fetch config for ${owner}/${repo}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clears the cache for a specific repository
 */
async function clearConfigCache(owner, repo) {
  const cacheKey = `config_${owner}_${repo}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;

  await chrome.storage.local.remove([cacheKey, cacheTimestampKey]);
  console.log(`[Service Worker] Cache cleared for ${owner}/${repo}`);
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', request);

  if (request.action === 'fetchConfig') {
    const { owner, repo } = request;

    if (!owner || !repo) {
      sendResponse({
        success: false,
        error: 'Missing owner or repo parameter'
      });
      return;
    }

    // Handle async response
    fetchConfigWithCache(owner, repo)
      .then(result => {
        console.log('[Service Worker] Sending response:', result.success ? 'success' : 'failed');
        sendResponse(result);
      })
      .catch(error => {
        console.error('[Service Worker] Error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }

  if (request.action === 'clearCache') {
    const { owner, repo } = request;

    clearConfigCache(owner, repo)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

  if (request.action === 'fetchWorkflows') {
    const { owner, repo } = request;

    if (!owner || !repo) {
      sendResponse({
        success: false,
        error: 'Missing owner or repo parameter'
      });
      return;
    }

    fetchWorkflows(owner, repo)
      .then(result => {
        console.log('[Service Worker] Sending workflows response');
        sendResponse(result);
      })
      .catch(error => {
        console.error('[Service Worker] Error fetching workflows:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

});

// Log when service worker is activated
console.log('[Service Worker] GitHub Actions Folder Organizer service worker loaded');
