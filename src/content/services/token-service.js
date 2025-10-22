/**
 * Token Service
 * Manages GitHub API token storage, validation, and retrieval
 */

const TOKEN_STORAGE_KEY = 'github_token';

/**
 * Saves a GitHub API token to Chrome storage
 * @param {string} token - The GitHub personal access token
 * @returns {Promise<void>}
 */
async function saveToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: must be a non-empty string');
  }

  await chrome.storage.sync.set({ [TOKEN_STORAGE_KEY]: token });
  console.log('[Token Service] Token saved successfully');
}

/**
 * Retrieves the stored GitHub API token
 * @returns {Promise<string|null>} The token if exists, null otherwise
 */
async function getToken() {
  try {
    const result = await chrome.storage.sync.get(TOKEN_STORAGE_KEY);
    return result[TOKEN_STORAGE_KEY] || null;
  } catch (error) {
    console.error('[Token Service] Failed to retrieve token:', error);
    return null;
  }
}

/**
 * Clears the stored GitHub API token
 * @returns {Promise<void>}
 */
async function clearToken() {
  await chrome.storage.sync.remove(TOKEN_STORAGE_KEY);
  console.log('[Token Service] Token cleared');
}

/**
 * Validates token format (basic check)
 * GitHub tokens start with: ghp_ (personal), gho_ (OAuth), ghs_ (server), or github_pat_ (fine-grained)
 * @param {string} token - Token to validate
 * @returns {boolean} True if format appears valid
 */
function validateTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const validPrefixes = ['ghp_', 'gho_', 'ghs_', 'github_pat_'];
  const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));

  if (!hasValidPrefix) {
    console.warn('[Token Service] Token does not have a recognized GitHub prefix');
    return false;
  }

  if (token.length < 20) {
    console.warn('[Token Service] Token appears too short');
    return false;
  }

  return true;
}

/**
 * Tests if a token is valid by making an API call to GitHub
 * @param {string} token - Token to test
 * @returns {Promise<{valid: boolean, error?: string, rateLimit?: object}>}
 */
async function testToken(token) {
  if (!validateTokenFormat(token)) {
    return {
      valid: false,
      error: 'Invalid token format'
    };
  }

  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        rateLimit: {
          limit: data.rate.limit,
          remaining: data.rate.remaining,
          reset: new Date(data.rate.reset * 1000)
        }
      };
    } else if (response.status === 401) {
      return {
        valid: false,
        error: 'Unauthorized: Token is invalid or expired'
      };
    } else if (response.status === 403) {
      return {
        valid: false,
        error: 'Forbidden: Token lacks required permissions'
      };
    } else {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Network error: ${error.message}`
    };
  }
}

/**
 * Checks if a token is currently stored
 * @returns {Promise<boolean>} True if token exists
 */
async function hasToken() {
  const token = await getToken();
  return token !== null && token.length > 0;
}
