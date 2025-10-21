# Developer Guide

This document contains development-specific information for working on the GitHub Actions Folder Organizer extension.

## Project Structure

```
github-actions-folders/
├── manifest.json                 # Extension manifest (Manifest V3)
├── src/
│   ├── content/
│   │   ├── content.js           # Main content script - handles DOM manipulation
│   │   └── content.css          # Folder styles (Primer CSS variables)
│   ├── background/
│   │   └── service-worker.js    # Background service worker - caching & API coordination
│   ├── options/
│   │   ├── options.html         # Options page for cache management
│   │   ├── options.js           # Options page logic
│   │   └── options.css          # Options page styles
│   └── utils/
│       ├── github-api.js        # GitHub API utilities (raw.githubusercontent.com)
│       ├── config-parser.js     # JSON config parser
│       └── url-parser.js        # URL parsing for repo detection
└── icons/                        # Extension icons
```

## Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No frameworks - lightweight and fast
- **Primer CSS Variables**: GitHub's design system for native look and feel
- **GitHub Session Auth**: Uses browser's existing GitHub login (no tokens needed)

## Development Setup

1. Clone the repository
2. Make changes to the code
3. Navigate to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the project directory
6. Make changes and click the refresh icon on the extension card to reload

## Architecture

### Content Script (`content.js`)

- Runs on GitHub Actions pages
- Detects URL changes (GitHub is a SPA)
- Fetches config via service worker
- Manipulates DOM to create folder structure
- Handles expand/collapse state
- Matches Primer CSS styling

### Service Worker (`service-worker.js`)

- Coordinates GitHub API requests
- Implements caching layer (reduces API calls)
- Handles chrome.storage management
- Provides messaging interface to content script

### Config Format

The extension looks for `.github/actions-folders.json`:

```json
{
  "folders": [
    {
      "name": "Folder Name",
      "workflows": ["workflow1.yml", "workflow2.yml"]
    }
  ]
}
```

- Workflow filenames only (no paths)
- Uncategorized workflows automatically grouped
- Case-sensitive matching

## Testing

### Manual Testing

1. Make changes
2. Reload extension at `chrome://extensions/`
3. Navigate to GitHub Actions page
4. Check browser console for `[GitHub Actions Folders]` logs

### Test Repository

Use [AntoineGagnon/miryoku_zmk](https://github.com/AntoineGagnon/miryoku_zmk) for testing:
- Has a working config file
- Multiple workflows for folder testing
- Public repository (no auth issues)

## Debugging

### Content Script Logs

- Open DevTools on any GitHub Actions page
- Look for `[GitHub Actions Folders]` prefixed messages
- Shows config loading, folder creation, and errors

### Service Worker Logs

- Go to `chrome://extensions/`
- Find the extension card
- Click "service worker" link
- View background script logs and errors

### Common Issues

**Config not loading:**
- Check network tab for 404s on `raw.githubusercontent.com`
- Verify file path is exactly `.github/actions-folders.json`
- Ensure file is on default branch (`main`/`master`)

**Folders not appearing:**
- Verify GitHub's workflow sidebar is present
- Check console for DOM manipulation errors
- Ensure workflow filenames match exactly (case-sensitive)

**Styles not matching:**
- Primer CSS variables might have changed
- Check GitHub's source for updated variable names
- Test in both light and dark mode

## Performance Considerations

### Caching Strategy

- Configs cached per repository
- Cache expires based on user preference (options page)
- Service worker coordinates all cache operations
- Avoids rate limiting by GitHub API

### DOM Manipulation

- Waits for GitHub's sidebar to load
- Uses MutationObserver for SPA navigation
- Minimal DOM queries (cached selectors)
- CSS-based animations (no JavaScript animations)

## Extension Permissions

**Why each permission is needed:**

- `github.com`: Detect Actions pages and inject content script
- `raw.githubusercontent.com`: Fetch config files from repositories
- `storage`: Cache configs locally for performance
- `scripting`: Inject content script dynamically (Manifest V3 requirement)

## Publishing Checklist

- [ ] Update version in `manifest.json`
- [ ] Update CHANGELOG in README
- [ ] Test in clean browser profile
- [ ] Test with public and private repos
- [ ] Verify all permissions are justified
- [ ] Create promotional images (1280x800, 640x400, 440x280, 128x128)
- [ ] Write Chrome Web Store description
- [ ] Test on different screen sizes
- [ ] Verify dark mode support

## Code Style

- Use `const` for all variables unless mutation is required
- Prefer functional patterns over classes
- Keep functions small and single-purpose
- Comment complex DOM manipulation logic
- Use descriptive variable names
- Follow existing code formatting

## Future Enhancements

Potential features to consider:

- Drag-and-drop folder reordering
- Workflow search/filter
- Custom folder icons/colors
- Export/import folder configurations
- Workflow status indicators in folders
- Keyboard shortcuts for folder navigation
- Multi-repository config sharing

## Contributing

When contributing:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (see Testing section)
5. Submit a pull request with clear description

## Resources

- [Chrome Extension Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [GitHub Primer CSS](https://primer.style/css/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
