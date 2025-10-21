/**
 * CSS Injector Module
 * Handles injecting and removing CSS to hide original workflow list
 * Follows Single Responsibility Principle - only responsible for CSS injection
 */

/**
 * Injects CSS to immediately hide the workflow list
 * Prevents flash of original GitHub UI before folders load
 */
function injectHidingCSS() {
  // Check if already injected
  if (document.getElementById(HIDING_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = HIDING_STYLE_ID;
  style.textContent = HIDING_CSS_SELECTORS;
  document.head.appendChild(style);
  console.log('[GitHub Actions Folders] Hiding CSS injected');
}

/**
 * Removes the injected hiding CSS
 * Restores visibility of original GitHub UI
 */
function removeHidingCSS() {
  const style = document.getElementById(HIDING_STYLE_ID);
  if (style) {
    style.remove();
    console.log('[GitHub Actions Folders] Hiding CSS removed');
  }
}
