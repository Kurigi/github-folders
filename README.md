# GitHub Actions Folder Organizer

A Chrome extension that allows you to organize GitHub Actions workflows into custom folders for better project organization.

## Features

- **Custom Folder Organization**: Define your own folder structure for workflows
- **Collapsible Folders**: Expand/collapse folders to manage visibility
- **Automatic Detection**: Works automatically when you visit GitHub Actions pages
- **Caching**: Smart caching to reduce API calls and improve performance
- **GitHub Design**: Matches GitHub's Primer CSS design system
- **Private Repo Support**: Works with both public and private repositories (using your GitHub session)
- **Graceful Fallback**: Falls back to default GitHub UI if config is missing or invalid

## Installation

### Development Mode

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `github-actions-folders` directory
6. The extension is now installed!

### Production (Future)

Will be available on the Chrome Web Store (pending publication).

## Configuration

Create a file named `actions-folders.json` in your repository at `.github/actions-folders.json`:

```json
{
  "folders": [
    {
      "name": "Build & Test",
      "workflows": [
        "ci.yml",
        "test.yml"
      ]
    },
    {
      "name": "Deployment",
      "workflows": [
        "deploy-prod.yml",
        "deploy-staging.yml"
      ]
    },
    {
      "name": "Maintenance",
      "workflows": [
        "cleanup.yml",
        "security-scan.yml"
      ]
    }
  ]
}
```

### Configuration Format

- **folders**: Array of folder definitions
  - **name**: Display name for the folder
  - **workflows**: Array of workflow filenames (just the filename, not the full path)

### Workflow Filenames

Use just the filename of your workflow files (e.g., `ci.yml`, not `.github/workflows/ci.yml`).

### Uncategorized Workflows

Any workflows not listed in the config will be grouped into an "Uncategorized" folder automatically.

## Usage

1. Add the configuration file to your repository
2. Navigate to your repository's Actions page (`https://github.com/owner/repo/actions`)
3. The extension will automatically detect the config and reorganize the sidebar
4. Click folder headers to expand/collapse them
5. Click workflow names to navigate (works just like the default GitHub UI)

## Example

See the test repository for a working example:
- Repository: [AntoineGagnon/miryoku_zmk](https://github.com/AntoineGagnon/miryoku_zmk)
- Actions page: [Actions](https://github.com/AntoineGagnon/miryoku_zmk/actions)
- Config file: `.github/workflows/actions-folders.yml`

## Permissions

The extension requires:

- **Host permissions** for `github.com` and `raw.githubusercontent.com`:
  - To detect when you're on an Actions page
  - To fetch the configuration file from your repository
- **Storage permission**:
  - To cache configuration files for better performance

## Privacy

- The extension only runs on GitHub Actions pages
- Configuration files are fetched using your existing GitHub browser session
- No data is sent to external servers
- Cache is stored locally in your browser

## Development

### Project Structure

```
github-actions-folders/
├── manifest.json                 # Extension manifest
├── src/
│   ├── content/
│   │   ├── content.js           # Main content script
│   │   └── content.css          # Folder styles
│   ├── background/
│   │   └── service-worker.js    # Background service worker
│   ├── options/
│   │   ├── options.html         # Options page
│   │   ├── options.js
│   │   └── options.css
│   └── utils/
│       ├── github-api.js        # GitHub API utilities
│       ├── config-parser.js     # YAML parser
│       └── url-parser.js        # URL parsing
└── icons/
```

### Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **Primer CSS**: GitHub's design system (CSS variables)

### Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Navigate to a GitHub Actions page to test

### Debugging

- Open Chrome DevTools on the Actions page
- Check the Console for `[GitHub Actions Folders]` log messages
- Service worker logs: `chrome://extensions/` → Click "service worker" link under the extension

## Troubleshooting

### Extension not working

1. Check the browser console for error messages
2. Verify the config file exists at `.github/workflows/actions-folders.yml`
3. Ensure the YAML syntax is correct
4. Try clearing the cache in the extension options

### Config not loading

- Make sure the file is in the default branch (`main` or `master`)
- Check that the repository is accessible (for private repos, you must be logged in)
- Verify the filename is exactly `actions-folders.yml`

### Workflows not appearing

- Check that workflow filenames in the config match the actual files
- Filenames are case-sensitive
- Use only the filename (e.g., `ci.yml`), not the full path

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Author

Built for better GitHub Actions organization.

## Changelog

### Version 1.0.0 (2025-10-20)

- Initial release
- Basic folder organization
- Caching support
- Options page
- Dark mode support
