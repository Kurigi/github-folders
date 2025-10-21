/**
 * Options Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  const clearCacheBtn = document.getElementById('clearAllCache');
  const cacheStatus = document.getElementById('cacheStatus');
  const folderStatus = document.getElementById('folderStatus');
  const repoList = document.getElementById('repoList');

  // Load and display repositories with saved states
  loadRepositories();

  // Clear all cache button
  clearCacheBtn.addEventListener('click', async () => {
    try {
      // Clear all storage
      await chrome.storage.local.clear();

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
   * Shows a status message
   */
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;

    // Hide after 3 seconds
    setTimeout(() => {
      element.style.display = 'none';
      setTimeout(() => {
        element.className = 'status-message';
      }, 300);
    }, 3000);
  }
});
