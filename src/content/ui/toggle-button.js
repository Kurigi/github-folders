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
 * Creates a "Create Config File" button
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {HTMLElement} Create config button container
 */
function createConfigButton(owner, repo) {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = CLASS_NAMES.toggleContainer;

  const button = document.createElement('button');
  button.className = `${CLASS_NAMES.toggleButton} gaf-create-config-button`;

  const icon = document.createElement('span');
  icon.className = CLASS_NAMES.toggleIcon;
  icon.textContent = '📝';

  const label = document.createElement('span');
  label.className = CLASS_NAMES.toggleLabel;
  label.textContent = 'Create Config File';

  button.appendChild(icon);
  button.appendChild(label);
  buttonContainer.appendChild(button);

  // Handle button click - navigate to GitHub's file creation page
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const configUrl = buildConfigCreationUrl(owner, repo);
    console.log('[GitHub Actions Folders] Navigating to config creation:', configUrl);

    // Navigate in same tab
    window.location.href = configUrl;
  });

  return buttonContainer;
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

/**
 * Adds create config button to the original workflow list
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {HTMLElement} workflowList - Workflow list element
 */
function addConfigButton(owner, repo, workflowList) {
  const configButton = createConfigButton(owner, repo);

  const parent = workflowList.parentElement;
  if (parent) {
    // Insert after the workflow list
    parent.insertBefore(configButton, workflowList.nextSibling);
    console.log('[GitHub Actions Folders] Create config button added');
  }
}
