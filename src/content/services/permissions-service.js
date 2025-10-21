/**
 * Permissions Service
 * Checks user permissions for repositories via GitHub API with DOM fallback
 * Follows Single Responsibility Principle - only responsible for permission checks
 */

/**
 * Gets the current GitHub username from the DOM
 * @returns {string|null} Username if found, null otherwise
 */
function getCurrentUsername() {
  // Try to get username from user avatar button
  const userAvatar = document.querySelector('[data-target="user-avatar-button.menu"]');
  if (userAvatar) {
    const img = userAvatar.querySelector('img[alt^="@"]');
    if (img) {
      const alt = img.getAttribute('alt');
      // Alt text is "@username"
      const username = alt.replace('@', '');
      console.log('[GitHub Actions Folders] Found username from avatar:', username);
      return username;
    }
  }

  // Fallback: try to get from profile link in user menu
  const profileLink = document.querySelector('[data-target="user-avatar-button.menu"] + div a[href^="/"][href*="/"]');
  if (profileLink) {
    const href = profileLink.getAttribute('href');
    const username = href.split('/')[1];
    if (username) {
      console.log('[GitHub Actions Folders] Found username from profile link:', username);
      return username;
    }
  }

  console.log('[GitHub Actions Folders] Could not find username from DOM');
  return null;
}

/**
 * Checks if the current user has write access to a repository via GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} username - Current user's username
 * @returns {Promise<boolean|null>} True if has access, false if no access, null if check failed
 */
async function checkWriteAccessFromAPI(owner, repo, username) {
  const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}`;
  console.log('[GitHub Actions Folders] Checking permissions via API:', url);

  try {
    const response = await fetch(url, {
      credentials: 'include' // Include cookies for authentication
    });

    if (response.status === 204) {
      console.log('[GitHub Actions Folders] API confirms write access (204 No Content)');
      return true;
    } else if (response.status === 404) {
      console.log('[GitHub Actions Folders] API confirms no write access (404 Not Found)');
      return false;
    } else {
      console.warn('[GitHub Actions Folders] API returned unexpected status:', response.status);
      return null; // Unknown state, fall back to DOM
    }
  } catch (error) {
    console.warn('[GitHub Actions Folders] API check failed:', error);
    return null; // Error, fall back to DOM
  }
}

/**
 * Checks if the current user has write access to a repository
 * Tries API first, falls back to DOM inspection
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if user has write access, false otherwise
 */
async function checkWriteAccess(owner, repo) {
  // First, get the current username
  const username = getCurrentUsername();

  if (username) {
    // Try API check first
    const apiResult = await checkWriteAccessFromAPI(owner, repo, username);

    if (apiResult !== null) {
      // API check succeeded (either true or false)
      return apiResult;
    }

    console.log('[GitHub Actions Folders] API check failed, falling back to DOM');
  } else {
    console.log('[GitHub Actions Folders] No username found, using DOM check only');
  }

  // Fall back to DOM check
  return checkWriteAccessFromDOM();
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
