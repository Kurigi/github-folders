# Testing Guide - GitHub Actions Folder Organizer

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory: `/Users/antoinegagnon/Code/Kurigi/github-folders/github-actions-folders/`
5. The extension should now be loaded

## Test Repository

**Repository**: [AntoineGagnon/miryoku_zmk](https://github.com/AntoineGagnon/miryoku_zmk)
**Actions Page**: https://github.com/AntoineGagnon/miryoku_zmk/actions
**Config File**: https://github.com/AntoineGagnon/miryoku_zmk/blob/master/.github/workflows/actions-folders.yml

The test repository has been configured with a sample `actions-folders.yml` file that organizes 19 workflows into 3 folders:
- **Build Examples** (9 workflows)
- **Build Process** (2 workflows)
- **Testing** (8 workflows)

## Testing Steps

### 1. Basic Functionality Test

1. Open Chrome
2. Navigate to: https://github.com/AntoineGagnon/miryoku_zmk/actions
3. Wait for page to load
4. **Expected**: The left sidebar should show 3 folders instead of the default workflow list
5. **Verify**: Console logs show `[GitHub Actions Folders]` messages

### 2. Folder Interaction Test

1. Click on a folder header (e.g., "Build Examples")
2. **Expected**: Folder collapses (workflows hidden)
3. **Verify**: Arrow icon changes from ▼ to ▶
4. Click again
5. **Expected**: Folder expands (workflows visible)

### 3. Workflow Navigation Test

1. Expand "Build Process" folder
2. Click on "main.yml"
3. **Expected**: Navigate to the workflow detail page
4. **Verify**: URL changes and workflow runs are displayed

### 4. Cache Test

1. Navigate to the Actions page
2. Open DevTools Console
3. Look for: `[Service Worker] Using cached config...`
4. Refresh the page within 5 minutes
5. **Expected**: Config loaded from cache (check console)

### 5. Error Handling Test

1. Navigate to a repository without config file (e.g., any other GitHub repo)
2. **Expected**: Original GitHub UI displayed (no folders)
3. **Verify**: Console shows: `No config found, using default GitHub UI`

### 6. Multiple Repository Test

1. Visit the test repo Actions page (folders should appear)
2. Navigate to another repo's Actions page
3. **Expected**: Default GitHub UI (or folders if that repo has config)
4. Return to test repo
5. **Expected**: Folders reappear correctly

### 7. Dark Mode Test

1. Enable Dark Mode in GitHub settings
2. Navigate to Actions page
3. **Expected**: Folders styled correctly in dark theme
4. **Verify**: Text readable, colors match GitHub's dark theme

### 8. Options Page Test

1. Click extension icon (or go to `chrome://extensions/`)
2. Click "Details" → "Extension options"
3. **Expected**: Options page opens
4. Click "Clear All Cache"
5. **Expected**: Success message appears
6. Revisit Actions page - config should be fetched fresh

## Console Debugging

Open Chrome DevTools Console on the Actions page to see logs:

```
[GitHub Actions Folders] Content script loaded
[GitHub Actions Folders] Initializing...
[GitHub Actions Folders] On Actions page: {owner: "AntoineGagnon", repo: "miryoku_zmk"}
[Service Worker] Fetching config from: https://raw.githubusercontent.com/...
[Service Worker] Config found on branch: master
[GitHub Actions Folders] Config fetched: (fresh)
[GitHub Actions Folders] Parsed config: {version: 1, folders: Array(3)}
[GitHub Actions Folders] Workflow list found, reorganizing...
[GitHub Actions Folders] Found 19 workflow links
[GitHub Actions Folders] Grouped into 3 folders + 0 uncategorized
[GitHub Actions Folders] Folder UI injected successfully
```

## Service Worker Debugging

1. Go to `chrome://extensions/`
2. Find the extension
3. Click "service worker" link (blue text)
4. New DevTools window opens for background script
5. Check for service worker logs

## Common Issues

### Extension doesn't load
- Check manifest.json is valid
- Verify all file paths are correct
- Check Chrome DevTools for syntax errors

### Folders don't appear
- Check if you're on an Actions page (URL must include `/actions`)
- Verify config file exists in repository
- Check console for error messages
- Try clearing cache in options page

### Styles look wrong
- Check if GitHub updated their CSS classes
- Inspect elements to see actual GitHub structure
- Verify content.css is loading

### Cache not clearing
- Open `chrome://extensions/` → Click "Clear storage"
- Or use the Options page "Clear All Cache" button

## Performance Verification

- Page load should not noticeably slow down
- Folder expand/collapse should be instant
- Config should cache for 5 minutes
- Network tab should show only one config fetch (unless cache expired)

## Next Steps After Testing

If all tests pass:
1. Create placeholder icons (16x16, 48x48, 128x128)
2. Package extension as .zip for distribution
3. Publish to Chrome Web Store (optional)
4. Document any issues found

If tests fail:
1. Note which test failed and error messages
2. Check console logs for details
3. Review code in relevant files
4. Fix and re-test
