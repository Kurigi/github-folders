/**
 * Messaging Service
 * Abstraction over Chrome Runtime Messaging API
 * Follows Dependency Inversion Principle - provides abstraction for service worker communication
 */

/**
 * Sends a message to the service worker and waits for response
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from service worker
 */
async function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Extracts workflows from the DOM (fallback for private repos)
 * @returns {Promise<Object>} Response with workflows array
 */
async function extractWorkflowsFromDOM() {
  console.log('[GitHub Actions Folders] Extracting workflows from DOM');

  // Find the "Show more workflows" button and click it if it exists
  // Look for buttons that contain "show more" or "Show more workflows" text
  const buttons = Array.from(document.querySelectorAll('button'));
  const showMoreButton = buttons.find(btn =>
    btn.textContent.toLowerCase().includes('show more')
  );

  if (showMoreButton) {
    console.log('[GitHub Actions Folders] Found "Show more" button, clicking it');
    showMoreButton.click();
    // Wait for the DOM to update after clicking
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Find all workflow links in the sidebar
  const workflowLinks = document.querySelectorAll('nav[aria-label="Actions Workflows"] a[href*="/actions/workflows/"]');

  const workflows = [];
  workflowLinks.forEach(link => {
    const name = link.textContent.trim();
    const href = link.getAttribute('href');

    // Extract workflow filename from URL
    // Format: /owner/repo/actions/workflows/filename.yml
    const match = href.match(/\/actions\/workflows\/([^?]+)/);
    if (match && match[1]) {
      workflows.push({
        name: name,
        path: `.github/workflows/${match[1]}`,
        state: 'active',
        // These fields match the API response format
        id: workflows.length + 1,
        node_id: '',
        badge_url: '',
        html_url: `https://github.com${href}`,
        url: ''
      });
    }
  });

  console.log(`[GitHub Actions Folders] Extracted ${workflows.length} workflows from DOM`);

  return {
    success: true,
    workflows: workflows,
    fromDOM: true
  };
}

/**
 * Fetches workflows from GitHub API via service worker, with DOM fallback
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Response with workflows or error
 */
async function fetchWorkflows(owner, repo) {
  try {
    // Try API first (works for public repos)
    console.log(`[GitHub Actions Folders] Fetching workflows via API for ${owner}/${repo}`);
    const response = await sendMessage({
      action: 'fetchWorkflows',
      owner,
      repo
    });

    if (response.success) {
      console.log(`[GitHub Actions Folders] Successfully fetched ${response.workflows?.length || 0} workflows via API`);
      return response;
    } else {
      console.log(`[GitHub Actions Folders] Workflows API failed for ${owner}/${repo} (likely private repo), falling back to DOM extraction`);
      // Fallback to DOM extraction for private repos
      return await extractWorkflowsFromDOM();
    }
  } catch (error) {
    console.log(`[GitHub Actions Folders] Workflows API error for ${owner}/${repo}: ${error.message}, falling back to DOM extraction`);
    // Fallback to DOM extraction
    return await extractWorkflowsFromDOM();
  }
}

/**
 * Fetches the configuration for the current repository via service worker
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Response with config or error
 */
async function fetchConfig(owner, repo) {
  try {
    console.log(`[GitHub Actions Folders] Fetching config for ${owner}/${repo}`);
    const response = await sendMessage({
      action: 'fetchConfig',
      owner,
      repo
    });

    if (response.success) {
      console.log(`[GitHub Actions Folders] Successfully fetched config for ${owner}/${repo}`);
      return response;
    } else {
      throw new Error(`Config fetch failed for ${owner}/${repo}: ${response.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`[GitHub Actions Folders] Error fetching config for ${owner}/${repo}:`, error.message);
    throw error;
  }
}
