/**
 * Folder Renderer Module
 * Builds folder UI from workflow data
 * Follows Single Responsibility Principle - only responsible for folder rendering
 */

/**
 * Builds folder UI from workflow data objects
 * @param {Map} folders - Map of folder name to workflows array
 * @param {Array} uncategorized - Array of uncategorized workflows
 * @returns {HTMLElement} Container element with folder UI
 */
function buildFolderUIFromData(folders, uncategorized) {
  const container = document.createElement('nav');
  container.className = CLASS_NAMES.folderContainer;
  container.setAttribute('aria-label', 'Organized Actions');

  // Create folders
  folders.forEach((workflows, folderName) => {
    const folder = createFolderFromData(folderName, workflows);
    container.appendChild(folder);
  });

  // Add uncategorized section if needed
  if (uncategorized.length > 0) {
    const uncatFolder = createFolderFromData('Uncategorized', uncategorized);
    container.appendChild(uncatFolder);
  }

  return container;
}

/**
 * Creates a folder element from workflow data objects
 * @param {string} name - Folder name
 * @param {Array} workflows - Array of workflow data objects
 * @returns {HTMLElement} Folder element
 */
function createFolderFromData(name, workflows) {
  const folder = document.createElement('div');
  folder.className = CLASS_NAMES.folder;

  // Folder header
  const header = document.createElement('button');
  header.className = CLASS_NAMES.folderHeader;
  header.setAttribute('aria-expanded', 'true');

  const icon = document.createElement('span');
  icon.className = CLASS_NAMES.folderIcon;
  icon.textContent = '▼';

  const title = document.createElement('span');
  title.className = CLASS_NAMES.folderTitle;
  title.textContent = name;

  const count = document.createElement('span');
  count.className = CLASS_NAMES.folderCount;
  count.textContent = `(${workflows.length})`;

  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(count);

  // Folder content
  const content = document.createElement('div');
  content.className = CLASS_NAMES.folderContent;

  workflows.forEach(workflowData => {
    const link = document.createElement('a');
    link.href = workflowData.url;
    link.className = CLASS_NAMES.workflowLink;
    link.textContent = workflowData.name;
    content.appendChild(link);
  });

  // Toggle functionality
  header.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', !isExpanded);
    content.style.display = isExpanded ? 'none' : 'block';
    icon.textContent = isExpanded ? '▶' : '▼';
  });

  folder.appendChild(header);
  folder.appendChild(content);

  return folder;
}
