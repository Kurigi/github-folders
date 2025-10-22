/**
 * Background Service Worker
 * Handles communication between content scripts and GitHub API
 * Supports optional GitHub token for better performance and private repo access
 */

// Chrome service workers use importScripts, Firefox loads via scripts array in manifest
if (typeof importScripts === 'function') {
  importScripts('/lib/browser-polyfill.min.js');
}

const CONFIG_FILE_PATH = '.github/actions-folders.json';
const CACHE_DURATION_MS = 5 * 60 * 1000;
const TOKEN_STORAGE_KEY = 'github_token';

/**
 * Retrieves the stored GitHub API token
 * @returns {Promise<string|null>} The token if exists, null otherwise
 */
async function getToken() {
  try {
    const result = await browser.storage.sync.get(TOKEN_STORAGE_KEY);
    return result[TOKEN_STORAGE_KEY] || null;
  } catch (error) {
    console.error('[Service Worker] Failed to retrieve token:', error);
    return null;
  }
}

/**
 * Tracks rate limit information from API response headers
 * @param {Headers} headers - Response headers from GitHub API
 */
function trackRateLimit(headers) {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (limit && remaining && reset) {
    browser.storage.local.set({
      rate_limit: {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000
      }
    });

    if (parseInt(remaining) < 100) {
      console.warn(`[Service Worker] Rate limit low: ${remaining}/${limit}`);
    }
  }
}

/**
 * Builds the raw GitHub URL for the config file
 */
function buildRawGitHubUrl(owner, repo, branch = 'main') {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${CONFIG_FILE_PATH}`;
}

/**
 * Fetches all workflows from GitHub API
 * Uses token authentication if available for better rate limits
 */
async function fetchWorkflows(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;
  const token = await getToken();

  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`[Service Worker] Fetching workflows from API with token: ${url}`);
  } else {
    console.log(`[Service Worker] Fetching workflows from API (unauthenticated): ${url}`);
  }

  try {
    const response = await fetch(url, { headers });
    trackRateLimit(response.headers);

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
 * Note: raw.githubusercontent.com relies on browser session auth, not API tokens
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
    const cached = await browser.storage.local.get([cacheKey, cacheTimestampKey]);
    const cachedContent = cached[cacheKey];
    const cachedTimestamp = cached[cacheTimestampKey];

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

    console.log(`[Service Worker] Fetching fresh config for ${owner}/${repo}`);
    const content = await fetchConfigFromBranches(owner, repo);

    await browser.storage.local.set({
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
 * Fetches repository information from GitHub API
 * Requires token for private repos, works unauthenticated for public repos
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<{success: boolean, defaultBranch?: string, isPrivate?: boolean, error?: string}>}
 */
async function fetchRepoInfo(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const token = await getToken();

  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });
    trackRateLimit(response.headers);

    if (response.ok) {
      const data = await response.json();
      console.log(`[Service Worker] Repo info retrieved: ${data.default_branch}, private: ${data.private}`);

      return {
        success: true,
        defaultBranch: data.default_branch,
        isPrivate: data.private
      };
    } else {
      console.warn(`[Service Worker] Failed to fetch repo info: ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    console.error('[Service Worker] Failed to fetch repo info:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Checks user permission level for a repository
 * REQUIRES token - this endpoint requires authentication even for public repos
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} username - GitHub username to check
 * @returns {Promise<{success: boolean, hasWriteAccess?: boolean, permission?: string, reason?: string, error?: string}>}
 */
async function checkUserPermission(owner, repo, username) {
  const token = await getToken();

  if (!token) {
    console.log('[Service Worker] No token available for permission check');
    return {
      success: false,
      reason: 'no_token'
    };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}/permission`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    trackRateLimit(response.headers);

    if (response.ok) {
      const data = await response.json();
      const hasWriteAccess = ['admin', 'write'].includes(data.permission);

      console.log(`[Service Worker] Permission check for ${username}: ${data.permission}`);

      return {
        success: true,
        hasWriteAccess,
        permission: data.permission
      };
    } else {
      console.warn(`[Service Worker] Permission check failed: ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    console.error('[Service Worker] Failed to check permission:', error);
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

  await browser.storage.local.remove([cacheKey, cacheTimestampKey]);
  console.log(`[Service Worker] Cache cleared for ${owner}/${repo}`);
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

  if (request.action === 'checkPermission') {
    const { owner, repo, username } = request;

    if (!owner || !repo || !username) {
      sendResponse({
        success: false,
        error: 'Missing owner, repo, or username parameter'
      });
      return;
    }

    checkUserPermission(owner, repo, username)
      .then(result => {
        console.log('[Service Worker] Sending permission check response');
        sendResponse(result);
      })
      .catch(error => {
        console.error('[Service Worker] Error checking permission:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

  if (request.action === 'getRepoInfo') {
    const { owner, repo } = request;

    if (!owner || !repo) {
      sendResponse({
        success: false,
        error: 'Missing owner or repo parameter'
      });
      return;
    }

    fetchRepoInfo(owner, repo)
      .then(result => {
        console.log('[Service Worker] Sending repo info response');
        sendResponse(result);
      })
      .catch(error => {
        console.error('[Service Worker] Error fetching repo info:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

});

console.log('[Service Worker] GitHub Actions Folder Organizer service worker loaded');
