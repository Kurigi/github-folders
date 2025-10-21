/**
 * Options Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  const clearCacheBtn = document.getElementById('clearAllCache');
  const cacheStatus = document.getElementById('cacheStatus');

  clearCacheBtn.addEventListener('click', async () => {
    try {
      // Clear all storage
      await chrome.storage.local.clear();

      // Show success message
      showStatus('All cache cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      showStatus('Failed to clear cache: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    cacheStatus.textContent = message;
    cacheStatus.className = `status-message ${type}`;

    // Hide after 3 seconds
    setTimeout(() => {
      cacheStatus.style.display = 'none';
      setTimeout(() => {
        cacheStatus.className = 'status-message';
      }, 300);
    }, 3000);
  }
});
