/**
 * Options Page JavaScript
 * Manages extension settings including GitHub token and cache
 */

document.addEventListener('DOMContentLoaded', () => {
  // Token management elements
  const tokenInput = document.getElementById('tokenInput');
  const testTokenBtn = document.getElementById('testToken');
  const saveTokenBtn = document.getElementById('saveToken');
  const clearTokenBtn = document.getElementById('clearToken');
  const tokenStatus = document.getElementById('tokenStatus');
  const rateLimitInfo = document.getElementById('rateLimitInfo');
  const rateLimitRemaining = document.getElementById('rateLimitRemaining');
  const rateLimitTotal = document.getElementById('rateLimitTotal');
  const rateLimitReset = document.getElementById('rateLimitReset');

  // Cache and folder elements
  const clearCacheBtn = document.getElementById('clearAllCache');
  const cacheStatus = document.getElementById('cacheStatus');
  const folderStatus = document.getElementById('folderStatus');
  const repoList = document.getElementById('repoList');

  // Load existing token status
  loadTokenStatus();

  // Load and display repositories with saved states
  loadRepositories();

  // Token: Test button
  testTokenBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();

    if (!token) {
      showStatus(tokenStatus, 'Please enter a token', 'error');
      return;
    }

    showStatus(tokenStatus, 'Testing token...', 'info');

    // Test token with API call
    const result = await testGitHubToken(token);

    if (result.valid) {
      showStatus(tokenStatus, `✅ Valid token! Rate limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`, 'success');
      displayRateLimit(result.rateLimit);
    } else {
      showStatus(tokenStatus, `❌ Invalid token: ${result.error}`, 'error');
      rateLimitInfo.style.display = 'none';
    }
  });

  // Token: Save button
  saveTokenBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();

    if (!token) {
      showStatus(tokenStatus, 'Please enter a token', 'error');
      return;
    }

    try {
      await browser.storage.sync.set({ github_token: token });
      showStatus(tokenStatus, '✅ Token saved successfully', 'success');
      tokenInput.value = ''; // Clear input for security
      loadTokenStatus(); // Reload status
    } catch (error) {
      showStatus(tokenStatus, `❌ Failed to save token: ${error.message}`, 'error');
    }
  });

  // Token: Clear button
  clearTokenBtn.addEventListener('click', async () => {
    try {
      await browser.storage.sync.remove('github_token');
      showStatus(tokenStatus, 'Token cleared successfully', 'success');
      rateLimitInfo.style.display = 'none';
      tokenInput.value = '';
      loadTokenStatus(); // Reload status
    } catch (error) {
      showStatus(tokenStatus, `Failed to clear token: ${error.message}`, 'error');
    }
  });

  // Clear all cache button
  clearCacheBtn.addEventListener('click', async () => {
    try {
      // Clear all storage
      await browser.storage.local.clear();

      // Show success message
      showStatus(cacheStatus, 'All cache cleared successfully!', 'success');

      // Reload repositories list (should be empty now)
      loadRepositories();
    } catch (error) {
      console.error('Error clearing cache:', error);
      showStatus(cacheStatus, 'Failed to clear cache: ' + error.message, 'error');
    }
  });

  /**
   * Loads and displays all repositories with saved folder states
   */
  async function loadRepositories() {
    try {
      const repos = await getAllRepositoriesWithStates();

      if (repos.length === 0) {
        repoList.innerHTML = '<p class="empty-state">No saved folder states yet. Visit a repository\'s Actions page to start.</p>';
        return;
      }

      // Create list of repositories
      const list = document.createElement('div');
      list.className = 'repo-list';

      repos.forEach(({ owner, repo }) => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';

        const repoInfo = document.createElement('div');
        repoInfo.className = 'repo-info';

        const repoName = document.createElement('span');
        repoName.className = 'repo-name';
        repoName.textContent = `${owner}/${repo}`;

        repoInfo.appendChild(repoName);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.textContent = 'Clear States';
        deleteBtn.onclick = () => clearRepoStates(owner, repo);

        repoItem.appendChild(repoInfo);
        repoItem.appendChild(deleteBtn);
        list.appendChild(repoItem);
      });

      repoList.innerHTML = '';
      repoList.appendChild(list);
    } catch (error) {
      console.error('Error loading repositories:', error);
      repoList.innerHTML = '<p class="error-state">Failed to load repositories</p>';
    }
  }

  /**
   * Clears folder states for a specific repository
   */
  async function clearRepoStates(owner, repo) {
    try {
      await clearFolderStatesForRepo(owner, repo);
      showStatus(folderStatus, `Cleared folder states for ${owner}/${repo}`, 'success');

      // Reload the list
      loadRepositories();
    } catch (error) {
      console.error('Error clearing folder states:', error);
      showStatus(folderStatus, 'Failed to clear folder states: ' + error.message, 'error');
    }
  }


  /**
   * Loads and displays current token status
   */
  async function loadTokenStatus() {
    try {
      const stored = await browser.storage.sync.get('github_token');

      if (stored.github_token && stored.github_token.length > 0) {
        showStatus(tokenStatus, '✅ Token configured (masked for security)', 'success');

        // Load and display rate limit if available
        const rateLimit = await browser.storage.local.get('rate_limit');
        if (rateLimit.rate_limit) {
          displayRateLimit(rateLimit.rate_limit);
        }
      } else {
        showStatus(tokenStatus, 'ℹ️ No token configured', 'info');
      }
    } catch (error) {
      console.error('Failed to load token status:', error);
    }
  }

  /**
   * Tests a GitHub token by making an API call
   */
  async function testGitHubToken(token) {
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
          error: 'Unauthorized - Token is invalid or expired'
        };
      } else if (response.status === 403) {
        return {
          valid: false,
          error: 'Forbidden - Token lacks required permissions'
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
   * Displays rate limit information
   */
  function displayRateLimit(rateLimit) {
    rateLimitRemaining.textContent = rateLimit.remaining;
    rateLimitTotal.textContent = rateLimit.limit;

    const resetDate = new Date(rateLimit.reset);
    rateLimitReset.textContent = resetDate.toLocaleTimeString();

    rateLimitInfo.style.display = 'block';
  }

  /**
   * Shows a status message
   */
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';

    // Hide after 3 seconds (except for info messages)
    if (type !== 'info') {
      setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
          element.style.display = 'none';
          element.style.opacity = '1';
        }, 300);
      }, 3000);
    }
  }
});
