/**
 * Workflow Organizer Module
 * Handles workflow-to-folder mapping and grouping logic
 * Follows Single Responsibility Principle - only responsible for workflow organization
 */

/**
 * Groups workflows by their configured folders
 * @param {Object} config - Configuration object with folders
 * @param {Array} apiWorkflows - Array of workflow objects from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {{folders: Map, uncategorized: Array}}
 */
function groupWorkflowsByFolder(config, apiWorkflows, owner, repo) {
  console.log('[GitHub Actions Folders] Processing', apiWorkflows.length, 'workflows from API');

  // Create a map of workflow filename to folder
  const workflowToFolder = new Map();
  config.folders.forEach(folder => {
    folder.workflows.forEach(workflow => {
      workflowToFolder.set(workflow, folder.name);
    });
  });

  // Group workflows by folder
  const folders = new Map();
  const uncategorized = [];

  apiWorkflows.forEach(workflow => {
    // workflow.path is like ".github/workflows/ci.yml"
    const filename = workflow.path.split('/').pop();
    const folderName = workflowToFolder.get(filename);

    // Construct the correct URL to the workflow runs page
    // Format: https://github.com/{owner}/{repo}/actions/workflows/{filename}
    const workflowUrl = `https://github.com/${owner}/${repo}/actions/workflows/${filename}`;

    const workflowData = {
      name: workflow.name,
      path: workflow.path,
      filename: filename,
      url: workflowUrl
    };

    if (folderName) {
      if (!folders.has(folderName)) {
        folders.set(folderName, []);
      }
      folders.get(folderName).push(workflowData);
    } else {
      uncategorized.push(workflowData);
    }
  });

  console.log('[GitHub Actions Folders] Grouped into', folders.size, 'folders +', uncategorized.length, 'uncategorized');

  return { folders, uncategorized };
}
