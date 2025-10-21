/**
 * DOM Selector Module
 * Handles finding DOM elements in GitHub's React-based UI
 * Follows Single Responsibility Principle - only responsible for DOM selection
 */

/**
 * Waits for the workflow list element to be available in the DOM
 * GitHub uses React, so we need to wait for dynamic content
 * @param {Function} callback - Function to call when element is found
 */
function waitForWorkflowList(callback) {
  const maxAttempts = MAX_DOM_WAIT_ATTEMPTS;
  let attempts = 0;

  const checkInterval = setInterval(() => {
    attempts++;

    // Try to find the workflow list
    let workflowList = null;
    for (const selector of WORKFLOW_LIST_SELECTORS) {
      workflowList = document.querySelector(selector);
      if (workflowList) break;
    }

    if (workflowList) {
      clearInterval(checkInterval);
      callback(workflowList);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.warn('[GitHub Actions Folders] Could not find workflow list after', maxAttempts, 'attempts');
    }
  }, DOM_POLL_INTERVAL_MS);
}

/**
 * Finds the sidebar container element
 * @returns {HTMLElement|null} Sidebar element or null if not found
 */
function findSidebar() {
  for (const selector of SIDEBAR_SELECTORS) {
    const sidebar = document.querySelector(selector);
    if (sidebar) return sidebar;
  }
  return null;
}
