/**
 * Main Entry Point
 * Orchestrates the extension initialization and workflow organization
 * Follows Dependency Inversion Principle - depends on abstractions from modules
 */

console.log('[GitHub Actions Folders] Content script loaded');

/**
 * Main initialization function
 * Coordinates all modules to achieve the extension's functionality
 */
async function initialize() {
  console.log('[GitHub Actions Folders] Initializing...');

  // Parse current URL using repository-info module
  const parsed = parseGitHubUrl(window.location.href);

  if (!parsed || !parsed.isActionsPage) {
    console.log('[GitHub Actions Folders] Not on Actions page, skipping');
    return;
  }

  console.log('[GitHub Actions Folders] On Actions page:', parsed);

  // Inject hiding CSS immediately to prevent flash (css-injector module)
  injectHidingCSS();

  // Show loading state early before finding exact workflow element (loading-state module)
  const earlyLoadingState = showLoadingStateEarly();

  // Wait for DOM to be ready first (dom-selector module)
  waitForWorkflowList(async (workflowList) => {
    console.log('[GitHub Actions Folders] Workflow list found');

    // Check if extension is enabled for this repository (storage-service module)
    const isEnabled = await getExtensionEnabled(parsed.owner, parsed.repo);

    if (!isEnabled) {
      console.log('[GitHub Actions Folders] Extension is disabled for this repository');
      // Remove hiding CSS and early loading to restore original UI
      removeHidingCSS();
      if (earlyLoadingState) earlyLoadingState.remove();
      // Add toggle button and keep original UI (toggle-button module)
      addToggleButton(parsed.owner, parsed.repo, workflowList, false);
      return;
    }

    // Remove early loading state, will be replaced with accurate one
    if (earlyLoadingState) earlyLoadingState.remove();

    // Hide original list and show loading state
    workflowList.style.display = 'none';
    const loadingState = showLoadingState(workflowList);

    try {
      // Fetch configuration and workflows in parallel (messaging-service module)
      const [configResult, workflowsResult] = await Promise.all([
        fetchConfig(parsed.owner, parsed.repo),
        fetchWorkflows(parsed.owner, parsed.repo)
      ]);

      if (!configResult.content) {
        console.log('[GitHub Actions Folders] No config found, using default GitHub UI');
        restoreOriginalUI(loadingState, workflowList);

        // Check if user has write access to show create config button
        const hasWriteAccess = await checkWriteAccess(parsed.owner, parsed.repo);

        if (hasWriteAccess) {
          console.log('[GitHub Actions Folders] User has write access, showing create config button');
          addConfigButton(parsed.owner, parsed.repo, workflowList);
        } else {
          console.log('[GitHub Actions Folders] User does not have write access, hiding button');
          // Don't show any button
        }

        return;
      }

      if (!workflowsResult.workflows) {
        console.log('[GitHub Actions Folders] No workflows found, using default GitHub UI');
        restoreOriginalUI(loadingState, workflowList);
        addToggleButton(parsed.owner, parsed.repo, workflowList, true);
        return;
      }

      console.log('[GitHub Actions Folders] Config fetched:', configResult.fromCache ? '(from cache)' : '(fresh)');
      console.log('[GitHub Actions Folders] Workflows fetched:', workflowsResult.workflows.length, 'total');

      // Config is already parsed JSON from service worker
      const config = configResult.content;
      console.log('[GitHub Actions Folders] Parsed config:', config);

      // Remove loading state
      loadingState.remove();

      // Remove hiding CSS now that we're replacing with folder UI
      removeHidingCSS();

      // Group workflows by folder (workflow-organizer module)
      const { folders, uncategorized } = groupWorkflowsByFolder(
        config,
        workflowsResult.workflows,
        parsed.owner,
        parsed.repo
      );

      // Build folder UI (folder-renderer module)
      const folderContainer = await buildFolderUIFromData(folders, uncategorized, parsed.owner, parsed.repo);

      // Add toggle button to the container (toggle-button module)
      const toggleButton = createToggleButton(parsed.owner, parsed.repo, true);
      folderContainer.appendChild(toggleButton);

      // Replace the original content
      const parent = workflowList.parentElement;
      if (parent) {
        workflowList.style.display = 'none';
        parent.insertBefore(folderContainer, workflowList.nextSibling);
        console.log('[GitHub Actions Folders] Folder UI injected successfully');
      }

    } catch (error) {
      console.warn('[GitHub Actions Folders] Failed to fetch/parse config:', error);
      console.log('[GitHub Actions Folders] Falling back to default GitHub UI');
      restoreOriginalUI(loadingState, workflowList);

      // Check if user has write access to show create config button
      const hasWriteAccess = await checkWriteAccess(parsed.owner, parsed.repo);

      if (hasWriteAccess) {
        console.log('[GitHub Actions Folders] User has write access, showing create config button');
        addConfigButton(parsed.owner, parsed.repo, workflowList);
      } else {
        console.log('[GitHub Actions Folders] User does not have write access, hiding button');
        // Don't show any button
      }
    }
  });
}

/**
 * Restores the original GitHub UI
 * @param {HTMLElement} loadingState - Loading state element to remove
 * @param {HTMLElement} workflowList - Workflow list element to show
 */
function restoreOriginalUI(loadingState, workflowList) {
  removeHidingCSS();
  loadingState.remove();
  workflowList.style.display = '';
}

/**
 * Cleans up the extension UI on navigation
 */
function cleanup() {
  // Clean up injected CSS
  removeHidingCSS();

  // Clean up old folder UI
  const oldContainer = document.querySelector(`.${CLASS_NAMES.folderContainer}`);
  if (oldContainer) {
    oldContainer.remove();
  }

  // Clean up old toggle buttons
  const oldToggle = document.querySelector(`.${CLASS_NAMES.toggleContainer}`);
  if (oldToggle) {
    oldToggle.remove();
  }

  // Clean up old loading state
  const oldLoading = document.querySelector(`.${CLASS_NAMES.loadingContainer}`);
  if (oldLoading) {
    oldLoading.remove();
  }

  // Show original workflow list again
  const originalList = document.querySelector('nav[aria-label="Actions"]');
  if (originalList) {
    originalList.style.display = '';
    originalList.style.opacity = '1';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also reinitialize on navigation (GitHub uses client-side routing)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('[GitHub Actions Folders] Navigation detected, reinitializing...');
    cleanup();
    initialize();
  }
}).observe(document, { subtree: true, childList: true });
