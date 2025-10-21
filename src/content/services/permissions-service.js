/**
 * Permissions Service
 * Checks user permissions for repositories
 * Follows Single Responsibility Principle - only responsible for permission checks
 */

/**
 * Checks if the current user has write access to a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if user has write access, false otherwise
 */
async function checkWriteAccess(owner, repo) {
  try {
    // Send message to service worker to check permissions via GitHub API
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_PERMISSIONS',
      owner: owner,
      repo: repo
    });

    console.log('[GitHub Actions Folders] API permission check response:', response);

    if (response && response.hasWriteAccess !== undefined) {
      console.log('[GitHub Actions Folders] Using API result:', response.hasWriteAccess);
      return response.hasWriteAccess;
    }

    // Fallback: try to detect from DOM if user is logged in and has access
    console.log('[GitHub Actions Folders] API check inconclusive, falling back to DOM detection');
    return checkWriteAccessFromDOM();
  } catch (error) {
    console.warn('[GitHub Actions Folders] Error checking permissions:', error);
    // On error, fallback to DOM detection instead of hiding button
    console.log('[GitHub Actions Folders] Error in API check, falling back to DOM detection');
    return checkWriteAccessFromDOM();
  }
}

/**
 * Fallback method: Check write access from DOM elements
 * Looks for repository action buttons that only appear for users with write access
 * @returns {boolean} Best guess of write access based on DOM
 */
function checkWriteAccessFromDOM() {
  // Check if user is logged in by looking for the user menu
  const userMenu = document.querySelector('[data-target="user-avatar-button.menu"]');
  if (!userMenu) {
    console.log('[GitHub Actions Folders] User not logged in');
    return false;
  }

  // Check for elements that indicate write access
  // These buttons/links only appear for users with write access
  const writeAccessIndicators = [
    'a[href*="/settings"]', // Settings tab in repo navigation
    '[data-hotkey="t"]', // Go to file hotkey (only for contributors)
    'summary[data-hotkey="."]', // Open in github.dev (only for contributors)
    '#new-pull-request', // New pull request button
  ];

  for (const selector of writeAccessIndicators) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('[GitHub Actions Folders] Write access detected from DOM via selector:', selector);
      return true;
    }
  }

  // Additional check: look for repo navigation tabs that indicate write access
  const repoNav = document.querySelector('nav[aria-label="Repository"]');
  if (repoNav) {
    // Check if Settings tab exists in repository navigation
    const settingsLink = Array.from(repoNav.querySelectorAll('a')).find(a =>
      a.textContent.trim() === 'Settings' || a.href.includes('/settings')
    );
    if (settingsLink) {
      console.log('[GitHub Actions Folders] Write access detected from Settings tab');
      return true;
    }
  }

  console.log('[GitHub Actions Folders] No write access detected from DOM');
  return false;
}

/**
 * Builds the GitHub URL to create the config file
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} defaultBranch - Default branch name (usually 'main' or 'master')
 * @returns {string} URL to GitHub's file creation page
 */
function buildConfigCreationUrl(owner, repo, defaultBranch = 'main') {
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

  return `https://github.com/${owner}/${repo}/new/${defaultBranch}?filename=${encodeURIComponent(filename)}&value=${encodedValue}`;
}
