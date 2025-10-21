/**
 * Loading State Module
 * Creates and manages loading overlay UI
 * Follows Single Responsibility Principle - only responsible for loading state
 */

/**
 * Creates a loading overlay element with spinner
 * @returns {HTMLElement} Loading overlay element
 */
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = CLASS_NAMES.loadingOverlay;
  overlay.setAttribute('aria-label', 'Loading workflow folders');

  // Create spinner container
  const spinnerContainer = document.createElement('div');
  spinnerContainer.className = CLASS_NAMES.loadingSpinner;

  // Create spinner using GitHub's octicon-style animation
  const spinner = document.createElement('svg');
  spinner.setAttribute('width', '32');
  spinner.setAttribute('height', '32');
  spinner.setAttribute('viewBox', '0 0 16 16');
  spinner.setAttribute('fill', 'currentColor');
  spinner.innerHTML = `
    <path d="M8 1.5A6.5 6.5 0 1 1 1.5 8H0a8 8 0 1 0 8-8v1.5z" opacity="0.3"/>
    <path d="M8 0v1.5A6.5 6.5 0 0 1 14.5 8H16a8 8 0 0 0-8-8z"/>
  `;

  spinnerContainer.appendChild(spinner);
  overlay.appendChild(spinnerContainer);

  return overlay;
}

/**
 * Shows loading overlay on the sidebar early, before finding exact workflow element
 * @returns {HTMLElement|null} Loading overlay or null if sidebar not found
 */
function showLoadingStateEarly() {
  // Check if already shown
  if (document.querySelector(`.${CLASS_NAMES.loadingOverlay}`)) {
    return null;
  }

  const sidebar = findSidebar();
  if (!sidebar) {
    console.log('[GitHub Actions Folders] Could not find sidebar for early loading state');
    return null;
  }

  const loadingOverlay = createLoadingOverlay();

  // Position relative to sidebar
  const sidebarStyle = window.getComputedStyle(sidebar);
  if (sidebarStyle.position === 'static') {
    sidebar.style.position = 'relative';
  }

  sidebar.appendChild(loadingOverlay);
  console.log('[GitHub Actions Folders] Early loading state shown');

  return loadingOverlay;
}

/**
 * Shows loading overlay after finding the workflow list element
 * @param {HTMLElement} workflowList - Workflow list element
 * @returns {HTMLElement} Loading overlay
 */
function showLoadingState(workflowList) {
  const loadingOverlay = createLoadingOverlay();

  const parent = workflowList.parentElement;
  if (parent) {
    // Ensure parent has position context
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    parent.appendChild(loadingOverlay);
  }
  return loadingOverlay;
}
