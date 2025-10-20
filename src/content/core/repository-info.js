/**
 * Repository Information Module
 * Handles URL parsing and repository information extraction
 * Follows Single Responsibility Principle - only responsible for URL/repo parsing
 */

/**
 * Parses GitHub URL to extract owner and repository information
 * @param {string} url - GitHub URL to parse
 * @returns {{owner: string, repo: string, isActionsPage: boolean} | null}
 */
function parseGitHubUrl(url) {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname !== 'github.com') {
      return null;
    }

    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
      return null;
    }

    const owner = pathSegments[0];
    const repo = pathSegments[1];
    const isActionsPage = pathSegments.length >= 3 && pathSegments[2] === 'actions';

    return { owner, repo, isActionsPage };
  } catch (error) {
    console.error('[GitHub Actions Folders] Error parsing URL:', error);
    return null;
  }
}
