/**
 * Loading State Module
 * Creates and manages loading skeleton UI
 * Follows Single Responsibility Principle - only responsible for loading state
 */

/**
 * Creates a loading skeleton element
 * @returns {HTMLElement} Loading container element
 */
function createLoadingSkeleton() {
  const loadingContainer = document.createElement('div');
  loadingContainer.className = CLASS_NAMES.loadingContainer;
  loadingContainer.setAttribute('aria-label', 'Loading workflow folders');

  // Create skeleton folder items
  for (let i = 0; i < LOADING_SKELETON_COUNT; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = CLASS_NAMES.skeletonFolder;

    const skeletonHeader = document.createElement('div');
    skeletonHeader.className = CLASS_NAMES.skeletonHeader;

    skeleton.appendChild(skeletonHeader);
    loadingContainer.appendChild(skeleton);
  }

  return loadingContainer;
}

/**
 * Shows loading state in the sidebar early, before finding exact workflow element
 * @returns {HTMLElement|null} Loading container or null if sidebar not found
 */
function showLoadingStateEarly() {
  // Check if already shown
  if (document.querySelector(`.${CLASS_NAMES.loadingContainer}`)) {
    return null;
  }

  const sidebar = findSidebar();
  if (!sidebar) {
    console.log('[GitHub Actions Folders] Could not find sidebar for early loading state');
    return null;
  }

  const loadingContainer = createLoadingSkeleton();

  // Insert at the beginning of sidebar
  sidebar.insertBefore(loadingContainer, sidebar.firstChild);
  console.log('[GitHub Actions Folders] Early loading state shown');

  return loadingContainer;
}

/**
 * Shows loading skeleton after finding the workflow list element
 * @param {HTMLElement} workflowList - Workflow list element
 * @returns {HTMLElement} Loading container
 */
function showLoadingState(workflowList) {
  const loadingContainer = createLoadingSkeleton();

  const parent = workflowList.parentElement;
  if (parent) {
    parent.insertBefore(loadingContainer, workflowList.nextSibling);
  }
  return loadingContainer;
}
