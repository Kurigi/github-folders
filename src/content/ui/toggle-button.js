/**
 * Toggle Button Module
 * Creates and manages the extension toggle button
 * Follows Single Responsibility Principle - only responsible for toggle button
 */

/**
 * Creates a toggle button for enabling/disabling the extension
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {boolean} isEnabled - Whether extension is currently enabled
 * @returns {HTMLElement} Toggle button container
 */
function createToggleButton(owner, repo, isEnabled) {
  const toggleContainer = document.createElement('div');
  toggleContainer.className = CLASS_NAMES.toggleContainer;

  const toggleButton = document.createElement('button');
  toggleButton.className = CLASS_NAMES.toggleButton;
  toggleButton.setAttribute('aria-pressed', isEnabled.toString());

  const icon = document.createElement('span');
  icon.className = CLASS_NAMES.toggleIcon;
  icon.textContent = isEnabled ? '✓' : '✗';

  const label = document.createElement('span');
  label.className = CLASS_NAMES.toggleLabel;
  label.textContent = isEnabled ? 'Folder view enabled' : 'Folder view disabled';

  toggleButton.appendChild(icon);
  toggleButton.appendChild(label);
  toggleContainer.appendChild(toggleButton);

  // Handle toggle click
  toggleButton.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const newState = !isEnabled;
    await setExtensionEnabled(owner, repo, newState);

    console.log('[GitHub Actions Folders] Extension', newState ? 'enabled' : 'disabled', 'for', owner + '/' + repo);

    // Reload the page to apply changes
    window.location.reload();
  });

  return toggleContainer;
}

/**
 * Adds toggle button to the original workflow list
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {HTMLElement} workflowList - Workflow list element
 * @param {boolean} isEnabled - Whether extension is enabled
 */
function addToggleButton(owner, repo, workflowList, isEnabled) {
  const toggleButton = createToggleButton(owner, repo, isEnabled);

  const parent = workflowList.parentElement;
  if (parent) {
    // Insert after the workflow list
    parent.insertBefore(toggleButton, workflowList.nextSibling);
    console.log('[GitHub Actions Folders] Toggle button added');
  }
}
