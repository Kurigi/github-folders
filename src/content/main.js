/**
 * Main Entry Point
 * Orchestrates the extension initialization and workflow organization
 */

console.log('[GitHub Actions Folders] Content script loaded');

/**
 * Main initialization function
 */
async function initialize() {
  console.log('[GitHub Actions Folders] Initializing...');

  const parsed = parseGitHubUrl(window.location.href);

  if (!parsed || !parsed.isActionsPage) {
    console.log('[GitHub Actions Folders] Not on Actions page, skipping');
    return;
  }

  console.log('[GitHub Actions Folders] On Actions page:', parsed);

  showTokenNotification().catch(error => {
    console.error('[GitHub Actions Folders] Failed to show notification:', error);
  });

  injectHidingCSS();

  const earlyLoadingState = showLoadingStateEarly();

  waitForWorkflowList(async (workflowList) => {
    console.log('[GitHub Actions Folders] Workflow list found');

    const isEnabled = await getExtensionEnabled(parsed.owner, parsed.repo);

    if (!isEnabled) {
      console.log('[GitHub Actions Folders] Extension is disabled for this repository');
      removeHidingCSS();
      if (earlyLoadingState) earlyLoadingState.remove();
      addToggleButton(parsed.owner, parsed.repo, workflowList, false);
      return;
    }

    if (earlyLoadingState) earlyLoadingState.remove();

    const loadingState = showLoadingState(workflowList);

    try {
      const [configResult, workflowsResult] = await Promise.all([
        fetchConfig(parsed.owner, parsed.repo),
        fetchWorkflows(parsed.owner, parsed.repo)
      ]);

      if (!configResult.content) {
        console.log('[GitHub Actions Folders] No config found, using default GitHub UI');
        restoreOriginalUI(loadingState, workflowList);

        const hasWriteAccess = await checkWriteAccess(parsed.owner, parsed.repo);

        if (hasWriteAccess) {
          console.log('[GitHub Actions Folders] User has write access, showing create config button');
          addConfigButton(parsed.owner, parsed.repo, workflowList);
        } else {
          console.log('[GitHub Actions Folders] User does not have write access, hiding button');
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

      const config = configResult.content;
      console.log('[GitHub Actions Folders] Parsed config:', config);

      loadingState.remove();
      removeHidingCSS();

      const { folders, uncategorized } = groupWorkflowsByFolder(
        config,
        workflowsResult.workflows,
        parsed.owner,
        parsed.repo
      );

      const folderContainer = await buildFolderUIFromData(folders, uncategorized, parsed.owner, parsed.repo);

      const toggleButton = createToggleButton(parsed.owner, parsed.repo, true);
      folderContainer.appendChild(toggleButton);

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

      const hasWriteAccess = await checkWriteAccess(parsed.owner, parsed.repo);

      if (hasWriteAccess) {
        console.log('[GitHub Actions Folders] User has write access, showing create config button');
        addConfigButton(parsed.owner, parsed.repo, workflowList);
      } else {
        console.log('[GitHub Actions Folders] User does not have write access, hiding button');
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
  removeHidingCSS();

  const oldContainer = document.querySelector(`.${CLASS_NAMES.folderContainer}`);
  if (oldContainer) {
    oldContainer.remove();
  }

  const oldToggle = document.querySelector(`.${CLASS_NAMES.toggleContainer}`);
  if (oldToggle) {
    oldToggle.remove();
  }

  const oldLoading = document.querySelector(`.${CLASS_NAMES.loadingOverlay}`);
  if (oldLoading) {
    oldLoading.remove();
  }

  const originalList = document.querySelector('nav[aria-label="Actions"]');
  if (originalList) {
    originalList.style.display = '';
    originalList.style.opacity = '1';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Reinitialize on navigation (GitHub uses client-side routing)
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
