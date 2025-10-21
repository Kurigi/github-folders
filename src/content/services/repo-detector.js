/**
 * Repository Detector Service
 * Detects whether a repository is public or private
 * Caches results for performance
 * Follows Single Responsibility Principle - only responsible for repo visibility detection
 */

/**
 * Detects if the current repository is private by checking DOM indicators
 * @returns {boolean} True if repository is private, false if public
 */
function isPrivateRepo() {
  // Check for private label badge
  const privateLabel = document.querySelector('[data-label-name="private"]');
  if (privateLabel) {
    console.log('[Repo Detector] Private repo detected: private label found');
    return true;
  }

  // Check for lock icon (octicon-lock)
  const lockIcon = document.querySelector('.octicon-lock');
  if (lockIcon) {
    console.log('[Repo Detector] Private repo detected: lock icon found');
    return true;
  }

  // Check for "Private" text in repository header
  const repoHeader = document.querySelector('[itemprop="name"]');
  if (repoHeader) {
    const privateText = Array.from(repoHeader.parentElement.querySelectorAll('*')).find(el =>
      el.textContent.trim() === 'Private'
    );
    if (privateText) {
      console.log('[Repo Detector] Private repo detected: "Private" text found');
      return true;
    }
  }

  // Check for private badge in page title area
  const privateBadge = Array.from(document.querySelectorAll('.Label')).find(el =>
    el.textContent.trim().toLowerCase() === 'private'
  );
  if (privateBadge) {
    console.log('[Repo Detector] Private repo detected: private badge found');
    return true;
  }

  console.log('[Repo Detector] Public repo detected: no private indicators found');
  return false;
}

/**
 * Caches the visibility status of a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {boolean} isPrivate - Whether the repository is private
 * @returns {Promise<void>}
 */
async function cacheRepoVisibility(owner, repo, isPrivate) {
  const cacheKey = `repo_visibility_${owner}_${repo}`;
  await chrome.storage.local.set({
    [cacheKey]: {
      isPrivate,
      timestamp: Date.now()
    }
  });
  console.log(`[Repo Detector] Cached visibility for ${owner}/${repo}: ${isPrivate ? 'private' : 'public'}`);
}

/**
 * Retrieves cached visibility status for a repository
 * Cache expires after 1 hour
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean|null>} Cached visibility or null if not cached/expired
 */
async function getCachedVisibility(owner, repo) {
  const cacheKey = `repo_visibility_${owner}_${repo}`;
  const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  try {
    const result = await chrome.storage.local.get(cacheKey);
    const cached = result[cacheKey];

    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION_MS) {
        console.log(`[Repo Detector] Using cached visibility for ${owner}/${repo}: ${cached.isPrivate ? 'private' : 'public'}`);
        return cached.isPrivate;
      } else {
        console.log(`[Repo Detector] Cache expired for ${owner}/${repo} (age: ${Math.round(age / 1000)}s)`);
      }
    }
  } catch (error) {
    console.error('[Repo Detector] Failed to retrieve cached visibility:', error);
  }

  return null;
}

/**
 * Gets the visibility of a repository, using cache if available
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} True if private, false if public
 */
async function getRepoVisibility(owner, repo) {
  // Try cache first
  const cached = await getCachedVisibility(owner, repo);
  if (cached !== null) {
    return cached;
  }

  // Detect from DOM
  const isPrivate = isPrivateRepo();

  // Cache the result
  await cacheRepoVisibility(owner, repo, isPrivate);

  return isPrivate;
}

/**
 * Clears cached visibility for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
async function clearRepoVisibilityCache(owner, repo) {
  const cacheKey = `repo_visibility_${owner}_${repo}`;
  await chrome.storage.local.remove(cacheKey);
  console.log(`[Repo Detector] Cleared visibility cache for ${owner}/${repo}`);
}

/**
 * Clears all cached repository visibility data
 * @returns {Promise<void>}
 */
async function clearAllVisibilityCache() {
  const allData = await chrome.storage.local.get(null);
  const visibilityKeys = Object.keys(allData).filter(key => key.startsWith('repo_visibility_'));

  if (visibilityKeys.length > 0) {
    await chrome.storage.local.remove(visibilityKeys);
    console.log(`[Repo Detector] Cleared ${visibilityKeys.length} visibility cache entries`);
  }
}
