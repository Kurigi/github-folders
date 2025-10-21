/**
 * DOM Selectors Constants
 * Centralized selectors for GitHub Actions page elements
 */

// Selectors for finding the workflow list nav element
const WORKFLOW_LIST_SELECTORS = [
  'nav[aria-label="Actions Workflows"]',
  'nav[aria-label="Actions"]',
  '.PageLayout-sidebar nav',
  'aside nav',
  '[data-testid="workflows-sidebar"]'
];

// Selectors for finding the sidebar container
const SIDEBAR_SELECTORS = [
  '.PageLayout-pane',
  '.PageLayout-sidebar',
  'aside[aria-label="Actions sidebar"]',
  'aside'
];

// CSS selectors to hide during loading
const HIDING_CSS_SELECTORS = `
  nav[aria-label="Actions Workflows"],
  nav[aria-label="Actions"] {
    visibility: hidden !important;
  }
`;

// Class names used by the extension
const CLASS_NAMES = {
  loadingOverlay: 'gaf-loading-overlay',
  loadingSpinner: 'gaf-loading-spinner',
  folderContainer: 'gaf-folder-container',
  folder: 'gaf-folder',
  folderHeader: 'gaf-folder-header',
  folderIcon: 'gaf-folder-icon',
  folderTitle: 'gaf-folder-title',
  folderCount: 'gaf-folder-count',
  folderContent: 'gaf-folder-content',
  workflowLink: 'gaf-workflow-link',
  toggleContainer: 'gaf-toggle-container',
  toggleButton: 'gaf-toggle-button',
  toggleIcon: 'gaf-toggle-icon',
  toggleLabel: 'gaf-toggle-label',
  hidingStyle: 'gaf-hiding-style'
};

// ID for injected CSS
const HIDING_STYLE_ID = 'gaf-hiding-style';
