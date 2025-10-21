/**
 * Permissions Service
 * Checks user permissions for repositories via GitHub API with DOM fallback
 * Uses token-based API when available, falls back to HTML scraping when not
 * Follows Single Responsibility Principle - only responsible for permission checks
 */

/**
 * Gets the current GitHub username from meta tag
 * @returns {string|null} Username if found, null otherwise
 */
function getCurrentUsername() {
  const metaUser = document.querySelector('meta[name="user-login"]');
  if (metaUser) {
    const username = metaUser.getAttribute('content');
    if (username) {
      console.log('[GitHub Actions Folders] Found username from meta tag:', username);
      return username;
    }
  }

  console.log('[GitHub Actions Folders] Could not find username from meta tag');
  return null;
}

/**
 * Checks write access via proper GitHub API (requires token)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} username - Current user's username
 * @returns {Promise<boolean|null>} True if has access, false if no access, null if check failed/no token
 */
async function checkWriteAccessViaAPI(owner, repo, username) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'checkPermission', owner, repo, username },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Permissions] Runtime error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }

        if (response && response.success) {
          console.log(`[Permissions] API permission check result: ${response.hasWriteAccess}`);
          resolve(response.hasWriteAccess);
        } else if (response && response.reason === 'no_token') {
          console.log('[Permissions] API check requires token (not available)');
          resolve(null);
        } else {
          console.warn('[Permissions] API permission check failed:', response?.error);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Checks if the current user has write access to a repository by checking settings page
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} username - Current user's username (unused, kept for compatibility)
 * @returns {Promise<boolean|null>} True if has access, false if no access, null if check failed
 */
async function checkWriteAccessFromHTMLEndpoint(owner, repo, username) {
  const url = `https://github.com/${owner}/${repo}/settings`;
  console.log('[GitHub Actions Folders] Checking write access by attempting to access settings:', url);

  try {
    // Try to access the repository settings page
    // This uses session cookies and will redirect if no access
    const response = await fetch(url, {
      method: 'HEAD', // Just check if we can access it
      redirect: 'manual' // Don't follow redirects
    });

    // If we get 200, we have access to settings = write access
    if (response.status === 200) {
      console.log('[GitHub Actions Folders] Write access confirmed: settings page accessible');
      return true;
    }

    // If we get 302/301 redirect, likely redirecting to login or repo home = no access
    if (response.status === 301 || response.status === 302 || response.status === 303) {
      console.log('[GitHub Actions Folders] No write access: settings page redirected');
      return false;
    }

    // 404 means settings page doesn't exist or no access
    if (response.status === 404 || response.status === 403) {
      console.log('[GitHub Actions Folders] No write access: settings page forbidden/not found');
      return false;
    }

    console.warn('[GitHub Actions Folders] Unexpected response status:', response.status);
    return null; // Unknown state, fall back to DOM
  } catch (error) {
    console.warn('[GitHub Actions Folders] Failed to check write access via settings page:', error);
    return null; // Error, fall back to DOM
  }
}

/**
 * Checks if the current user has write access to a repository
 * Strategy: Try API first (requires token), then HTML endpoint, then DOM inspection
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if user has write access, false otherwise
 */
async function checkWriteAccess(owner, repo) {
  // Get username from meta tag
  const username = getCurrentUsername();

  if (username) {
    // Try API first (requires token, works for any repo)
    const apiResult = await checkWriteAccessViaAPI(owner, repo, username);

    if (apiResult !== null) {
      console.log('[GitHub Actions Folders] Write access determined via API:', apiResult);
      return apiResult;
    }

    console.log('[GitHub Actions Folders] API check not available, trying HTML endpoint');

    // Try settings page access check (fallback)
    const htmlResult = await checkWriteAccessFromHTMLEndpoint(owner, repo, username);

    if (htmlResult !== null) {
      // HTML check succeeded (either true or false)
      console.log('[GitHub Actions Folders] Write access determined via HTML endpoint:', htmlResult);
      return htmlResult;
    }

    console.log('[GitHub Actions Folders] HTML permission check failed, falling back to DOM');
  }

  // Final fallback: DOM permission check
  return checkWriteAccessFromDOM();
}

/**
 * Check write access from DOM elements
 * Looks for repository action buttons that only appear for users with write access
 * @returns {boolean} True if write access detected, false otherwise
 */
function checkWriteAccessFromDOM() {
  // Check if user is logged in by looking for the user menu
  const userMenu = document.querySelector('[data-target="user-avatar-button.menu"]');
  if (!userMenu) {
    console.log('[GitHub Actions Folders] User not logged in (no avatar menu found)');
    return false;
  }

  console.log('[GitHub Actions Folders] User is logged in, checking for write access indicators');

  // Primary check: Settings tab in repository navigation (most reliable)
  const repoNav = document.querySelector('nav[aria-label="Repository"]');
  if (repoNav) {
    const settingsLink = Array.from(repoNav.querySelectorAll('a')).find(a =>
      a.textContent.trim() === 'Settings' || a.href.includes('/settings')
    );
    if (settingsLink) {
      console.log('[GitHub Actions Folders] Write access detected: Settings tab exists');
      return true;
    }
  }

  // Secondary checks: Other write access indicators
  const writeAccessIndicators = [
    { selector: '[data-hotkey="t"]', name: 'Go to file hotkey' },
    { selector: 'summary[data-hotkey="."]', name: 'Open in github.dev hotkey' },
    { selector: '[data-content="New pull request"]', name: 'New pull request button' },
    { selector: 'button[data-hotkey="c"]', name: 'Create new file hotkey' },
  ];

  for (const { selector, name } of writeAccessIndicators) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`[GitHub Actions Folders] Write access detected: ${name} found`);
      return true;
    }
  }

  console.log('[GitHub Actions Folders] No write access detected - no indicators found');
  return false;
}

/**
 * Gets default branch via proper GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<string|null>} Branch name or null if failed
 */
async function getDefaultBranchViaAPI(owner, repo) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getRepoInfo', owner, repo },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[GitHub Actions Folders] Runtime error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }

        if (response && response.success && response.defaultBranch) {
          console.log(`[GitHub Actions Folders] Default branch from API: ${response.defaultBranch}`);
          resolve(response.defaultBranch);
        } else {
          console.warn('[GitHub Actions Folders] API branch detection failed');
          resolve(null);
        }
      }
    );
  });
}

/**
 * Detects the default branch by fetching the repository home page
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<string>} Default branch name (e.g., 'main' or 'master')
 */
async function getDefaultBranch(owner, repo) {
  // Try API first
  const apiResult = await getDefaultBranchViaAPI(owner, repo);

  if (apiResult) {
    return apiResult;
  }

  console.log('[GitHub Actions Folders] API branch detection not available, falling back to HTML parsing');

  // Fallback: HTML parsing
  try {
    // Fetch the repository home page (uses session cookies for private repos)
    const url = `https://github.com/${owner}/${repo}`;
    console.log('[GitHub Actions Folders] Fetching default branch from repo page:', url);

    const response = await fetch(url);

    if (response.ok) {
      const html = await response.text();

      // Look for defaultBranch in JSON data embedded in the page
      const defaultBranchMatch = html.match(/"defaultBranch":"([^"]+)"/);
      if (defaultBranchMatch && defaultBranchMatch[1]) {
        const branchName = defaultBranchMatch[1];
        console.log('[GitHub Actions Folders] Detected default branch from HTML:', branchName);
        return branchName;
      }

      // Fallback: Look for refs/heads/branch pattern
      const refsMatch = html.match(/refs\/heads\/([^"'\s<>]+)/);
      if (refsMatch && refsMatch[1] && !refsMatch[1].includes('.zip')) {
        const branchName = refsMatch[1];
        console.log('[GitHub Actions Folders] Detected default branch from refs:', branchName);
        return branchName;
      }
    }
  } catch (error) {
    console.warn('[GitHub Actions Folders] Failed to fetch default branch from HTML:', error);
  }

  // Fallback to main
  console.log('[GitHub Actions Folders] Could not detect branch, using default: main');
  return 'main';
}

/**
 * Builds the GitHub URL to create the config file
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} defaultBranch - Default branch name (optional, will auto-detect)
 * @returns {Promise<string>} URL to GitHub's file creation page
 */
async function buildConfigCreationUrl(owner, repo, defaultBranch = null) {
  // Auto-detect branch if not provided
  const branch = defaultBranch || await getDefaultBranch(owner, repo);
  const filename = '.github/actions-folders.json';

  // Template configuration
  const template = {
    folders: [
      {
        name: "Build & Test",
        workflows: ["ci.yml", "test.yml"]
      },
      {
        name: "Deployment",
        workflows: ["deploy.yml"]
      }
    ]
  };

  const templateJson = JSON.stringify(template, null, 2);
  const encodedValue = encodeURIComponent(templateJson);

  return `https://github.com/${owner}/${repo}/new/${branch}?filename=${encodeURIComponent(filename)}&value=${encodedValue}`;
}
